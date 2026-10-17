package expo.modules.timeralarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

/** Fired by the exact alarm at the session's end time: starts the ringing service. */
class TimerAlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val start = Intent(context, TimerAlarmService::class.java)
      .setAction(TimerAlarmService.ACTION_START)
      .putExtra(TimerAlarm.EXTRA_TITLE, intent.getStringExtra(TimerAlarm.EXTRA_TITLE))
      .putExtra(TimerAlarm.EXTRA_BODY, intent.getStringExtra(TimerAlarm.EXTRA_BODY))
      .putExtra(TimerAlarm.EXTRA_SOUND, intent.getStringExtra(TimerAlarm.EXTRA_SOUND))
    // Apps may start a foreground service right after an exact alarm fires, even from the background.
    ContextCompat.startForegroundService(context, start)
  }
}
