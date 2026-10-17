package expo.modules.timeralarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Schedules the meditation end alarm the way clock apps do: AlarmManager.setAlarmClock(), which the
 * system never defers for battery saving. When it fires, TimerAlarmReceiver starts TimerAlarmService,
 * which rings until the user stops it.
 */
object TimerAlarm {
  const val EXTRA_TITLE = "title"
  const val EXTRA_BODY = "body"
  const val EXTRA_SOUND = "sound"
  private const val REQUEST_CODE = 2540

  /** Listeners notified when ringing starts/stops (the JS module subscribes while alive). */
  val listeners = mutableSetOf<(Boolean) -> Unit>()

  @Volatile
  var isRinging: Boolean = false
    internal set(value) {
      field = value
      listeners.toList().forEach { it(value) }
    }

  private fun alarmIntent(context: Context, title: String = "", body: String = "", sound: String = ""): PendingIntent {
    val intent = Intent(context, TimerAlarmReceiver::class.java)
      .putExtra(EXTRA_TITLE, title)
      .putExtra(EXTRA_BODY, body)
      .putExtra(EXTRA_SOUND, sound)
    return PendingIntent.getBroadcast(context, REQUEST_CODE, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun launchAppIntent(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(context, REQUEST_CODE + 1, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  /** @return true if scheduled as an exact alarm-clock alarm. */
  fun schedule(context: Context, atMillis: Long, title: String, body: String, sound: String): Boolean {
    val alarmManager = context.getSystemService(AlarmManager::class.java)
    val operation = alarmIntent(context, title, body, sound)
    val canExact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()
    return try {
      if (canExact) {
        alarmManager.setAlarmClock(AlarmManager.AlarmClockInfo(atMillis, launchAppIntent(context)), operation)
        true
      } else {
        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, operation)
        false
      }
    } catch (e: SecurityException) {
      alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMillis, operation)
      false
    }
  }

  fun cancel(context: Context) {
    context.getSystemService(AlarmManager::class.java).cancel(alarmIntent(context))
  }

  fun stopRinging(context: Context) {
    if (!isRinging) return
    context.startService(Intent(context, TimerAlarmService::class.java).setAction(TimerAlarmService.ACTION_STOP))
  }
}
