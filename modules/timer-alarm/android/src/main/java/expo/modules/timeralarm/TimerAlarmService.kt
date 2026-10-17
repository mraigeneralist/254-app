package expo.modules.timeralarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

/**
 * Rings like a clock-app timer: loops the chosen meditation bell on the ALARM audio stream (alarm
 * volume, plays even with the ringer on silent) and shows a "Time's up" notification with a Stop
 * button — until the user stops it (or 10 minutes pass, as a safety net). No vibration, by design.
 */
class TimerAlarmService : Service() {
  companion object {
    const val ACTION_START = "expo.modules.timeralarm.START"
    const val ACTION_STOP = "expo.modules.timeralarm.STOP"
    private const val CHANNEL_ID = "meditation-alarm"
    private const val NOTIFICATION_ID = 2540
    private const val MAX_RING_MS = 10 * 60 * 1000L
  }

  private var player: MediaPlayer? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private val handler = Handler(Looper.getMainLooper())
  private val autoStop = Runnable { stopRinging() }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> stopRinging()
      else -> startRinging(
        intent?.getStringExtra(TimerAlarm.EXTRA_TITLE).orEmpty().ifEmpty { "Time's up" },
        intent?.getStringExtra(TimerAlarm.EXTRA_BODY).orEmpty().ifEmpty { "Your meditation session is complete." },
        intent?.getStringExtra(TimerAlarm.EXTRA_SOUND).orEmpty(),
      )
    }
    return START_NOT_STICKY
  }

  private fun startRinging(title: String, body: String, sound: String) {
    ensureChannel()
    val notification = buildNotification(title, body)
    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK else 0
    ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, type)

    if (player == null) {
      wakeLock = (getSystemService(Context.POWER_SERVICE) as PowerManager)
        .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "app254:timer-alarm")
        .apply { acquire(MAX_RING_MS + 5_000) }
      startSound(sound)
    }
    handler.removeCallbacks(autoStop)
    handler.postDelayed(autoStop, MAX_RING_MS)
    TimerAlarm.isRinging = true
  }

  /** res/raw/bell_<sound>.wav (bowl, gong, chimes, marimba); falls back to the bowl, then the phone's alarm. */
  private fun bellUri(sound: String): Uri {
    val res = resources.getIdentifier("bell_" + sound.ifEmpty { "bowl" }, "raw", packageName).takeIf { it != 0 }
      ?: resources.getIdentifier("bell_bowl", "raw", packageName)
    return if (res != 0) Uri.parse("android.resource://$packageName/$res")
    else RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
  }

  private fun startSound(sound: String) {
    try {
      player = MediaPlayer().apply {
        setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
        )
        setDataSource(this@TimerAlarmService, bellUri(sound))
        isLooping = true
        prepare()
        start()
      }
    } catch (e: Exception) {
      player?.release()
      player = null
    }
  }

  private fun stopRinging() {
    handler.removeCallbacks(autoStop)
    player?.let {
      try { it.stop() } catch (_: Exception) {}
      it.release()
    }
    player = null
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
    ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
    stopSelf()
    TimerAlarm.isRinging = false
  }

  override fun onDestroy() {
    if (TimerAlarm.isRinging) stopRinging()
    super.onDestroy()
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = getSystemService(NotificationManager::class.java)
    if (nm.getNotificationChannel(CHANNEL_ID) != null) return
    nm.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, "Meditation alarm", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Rings when a meditation session ends, until you stop it"
        setSound(null, null) // the service plays the bell itself, on the alarm stream
        enableVibration(false)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      },
    )
  }

  private fun buildNotification(title: String, body: String): Notification {
    val stop = PendingIntent.getService(
      this, 1, Intent(this, TimerAlarmService::class.java).setAction(ACTION_STOP),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val open = TimerAlarm.launchAppIntent(this)
    val icon = resources.getIdentifier("notification_icon", "drawable", packageName).takeIf { it != 0 }
      ?: applicationInfo.icon
    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(icon)
      .setColor(0xFF9BB167.toInt())
      .setContentTitle(title)
      .setContentText(body)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(true)
      .setAutoCancel(false)
      .setSilent(true)
      .setContentIntent(open)
      .setFullScreenIntent(open, true)
      .setDeleteIntent(stop)
      .addAction(0, "Stop", stop)
      .build()
  }
}
