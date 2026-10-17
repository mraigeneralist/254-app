package expo.modules.timeralarm

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TimerAlarmModule : Module() {
  private val context get() = requireNotNull(appContext.reactContext) { "React context unavailable" }

  private val ringingListener: (Boolean) -> Unit = { ringing ->
    sendEvent("onRingingChange", mapOf("ringing" to ringing))
  }

  override fun definition() = ModuleDefinition {
    Name("TimerAlarm")

    Events("onRingingChange")

    OnCreate { TimerAlarm.listeners.add(ringingListener) }
    OnDestroy { TimerAlarm.listeners.remove(ringingListener) }

    /** Schedule the end alarm. Returns true if it is an exact (alarm-clock) alarm. */
    Function("schedule") { atMillis: Double, title: String, body: String, sound: String ->
      TimerAlarm.schedule(context, atMillis.toLong(), title, body, sound)
    }

    /** Cancel a scheduled (not yet ringing) end alarm. */
    Function("cancel") {
      TimerAlarm.cancel(context)
    }

    /** Stop the bell if it is ringing. */
    Function("stop") {
      TimerAlarm.stopRinging(context)
    }

    Function("isRinging") {
      TimerAlarm.isRinging
    }
  }
}
