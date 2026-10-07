import { apiUrl } from "../config/api";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Navigate,
} from "react-router-dom";


const PERMISSIONS_API =
  apiUrl("/api/access/me/permissions/");

const RUNTIME_SETTINGS_API =
  apiUrl("/api/settings/runtime/");

const LOGOUT_API =
  apiUrl("/api/accounts/logout/");

const LAST_ACTIVITY_KEY =
  "session_last_activity";

const TIMEZONE_KEY =
  "system_timezone";

const DATE_FORMAT_KEY =
  "system_date_format";


function ProtectedRoute({
  module,
  children,
}) {
  const token =
    localStorage.getItem("token");


  const [loading, setLoading] =
    useState(true);

  const [allowed, setAllowed] =
    useState(false);

  const [unauthorized, setUnauthorized] =
    useState(false);

  const [
    sessionTimeoutMinutes,
    setSessionTimeoutMinutes,
  ] = useState(null);


  const timeoutRef =
    useRef(null);

  const lastActivityRef =
    useRef(Date.now());

  const logoutStartedRef =
    useRef(false);


  // =====================================================
  // CLEAR LOCAL SESSION
  // =====================================================

  const clearLocalSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    localStorage.removeItem(
      LAST_ACTIVITY_KEY
    );
  };


  // =====================================================
  // PERMISSION + RUNTIME SETTINGS CHECK
  // =====================================================

  useEffect(() => {
    let active = true;


    const loadProtectedRoute =
      async () => {
        if (!token) {
          clearLocalSession();

          if (active) {
            setUnauthorized(true);
            setLoading(false);
          }

          return;
        }


        try {
          setLoading(true);


          // =============================================
          // CHECK MODULE PERMISSION
          // =============================================

          const permissionResponse =
            await fetch(
              PERMISSIONS_API,
              {
                headers: {
                  Authorization:
                    `Token ${token}`,
                },
              }
            );


          if (
            permissionResponse.status ===
            401
          ) {
            clearLocalSession();

            if (active) {
              setUnauthorized(true);
            }

            return;
          }


          if (
            !permissionResponse.ok
          ) {
            if (active) {
              setAllowed(false);
            }

            return;
          }


          const permissionData =
            await permissionResponse.json();


          if (active) {
            setAllowed(
              Boolean(
                permissionData
                  .permissions?.[module]
              )
            );
          }


          // =============================================
          // LOAD SAFE RUNTIME SETTINGS
          // =============================================

          try {
            const runtimeResponse =
              await fetch(
                RUNTIME_SETTINGS_API,
                {
                  headers: {
                    Authorization:
                      `Token ${token}`,
                  },
                }
              );


            if (
              runtimeResponse.status ===
              401
            ) {
              clearLocalSession();

              if (active) {
                setUnauthorized(true);
              }

              return;
            }


            if (
              runtimeResponse.ok
            ) {
              const runtimeData =
                await runtimeResponse.json();


              // =====================================
              // SAVE GLOBAL TIMEZONE
              // =====================================

              localStorage.setItem(
                TIMEZONE_KEY,
                runtimeData.timezone ||
                  "Asia/Manila"
              );


              // =====================================
              // SAVE GLOBAL DATE FORMAT
              // =====================================

              localStorage.setItem(
                DATE_FORMAT_KEY,
                runtimeData.date_format ||
                  "MM/DD/YYYY"
              );


              // =====================================
              // SESSION TIMEOUT
              // =====================================

              const timeoutValue =
                Number(
                  runtimeData
                    .session_timeout_minutes
                );


              if (
                Number.isFinite(
                  timeoutValue
                ) &&
                timeoutValue > 0
              ) {
                if (active) {
                  setSessionTimeoutMinutes(
                    timeoutValue
                  );
                }

              } else {
                if (active) {
                  setSessionTimeoutMinutes(
                    60
                  );
                }
              }

            } else {
              console.warn(
                "Unable to load runtime settings. Using fallback settings."
              );


              localStorage.setItem(
                TIMEZONE_KEY,
                "Asia/Manila"
              );

              localStorage.setItem(
                DATE_FORMAT_KEY,
                "MM/DD/YYYY"
              );


              if (active) {
                setSessionTimeoutMinutes(
                  60
                );
              }
            }

          } catch (
            runtimeError
          ) {
            console.error(
              "Runtime settings error:",
              runtimeError
            );


            localStorage.setItem(
              TIMEZONE_KEY,
              "Asia/Manila"
            );

            localStorage.setItem(
              DATE_FORMAT_KEY,
              "MM/DD/YYYY"
            );


            if (active) {
              setSessionTimeoutMinutes(
                60
              );
            }
          }

        } catch (error) {
          console.error(
            "Permission check error:",
            error
          );


          if (active) {
            setAllowed(false);

            setSessionTimeoutMinutes(
              60
            );
          }

        } finally {
          if (active) {
            setLoading(false);
          }
        }
      };


    loadProtectedRoute();


    return () => {
      active = false;
    };

  }, [
    token,
    module,
  ]);


  // =====================================================
  // GLOBAL INACTIVITY SESSION TIMEOUT
  // =====================================================

  useEffect(() => {
    if (
      !token ||
      unauthorized ||
      !sessionTimeoutMinutes
    ) {
      return;
    }


    const timeoutMilliseconds =
      sessionTimeoutMinutes *
      60 *
      1000;


    // =============================================
    // LOGOUT USER
    // =============================================

    const logoutUser =
      async () => {
        if (
          logoutStartedRef.current
        ) {
          return;
        }


        logoutStartedRef.current =
          true;


        if (
          timeoutRef.current
        ) {
          clearTimeout(
            timeoutRef.current
          );
        }


        try {
          await fetch(
            LOGOUT_API,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Token ${token}`,
              },
            }
          );

        } catch (error) {
          console.error(
            "Automatic logout request error:",
            error
          );

        } finally {
          clearLocalSession();

          setUnauthorized(true);
        }
      };


    // =============================================
    // SCHEDULE LOGOUT
    // =============================================

    const scheduleLogout = () => {
      if (
        timeoutRef.current
      ) {
        clearTimeout(
          timeoutRef.current
        );
      }


      const now =
        Date.now();


      const elapsed =
        now -
        lastActivityRef.current;


      const remaining =
        timeoutMilliseconds -
        elapsed;


      if (
        remaining <= 0
      ) {
        logoutUser();
        return;
      }


      timeoutRef.current =
        setTimeout(
          logoutUser,
          remaining
        );
    };


    // =============================================
    // INITIAL LAST ACTIVITY
    // =============================================

    const storedActivity =
      Number(
        localStorage.getItem(
          LAST_ACTIVITY_KEY
        )
      );


    const now =
      Date.now();


    if (
      Number.isFinite(
        storedActivity
      ) &&
      storedActivity > 0 &&
      storedActivity <= now
    ) {
      lastActivityRef.current =
        storedActivity;

    } else {
      lastActivityRef.current =
        now;

      localStorage.setItem(
        LAST_ACTIVITY_KEY,
        String(now)
      );
    }


    // =============================================
    // RECORD USER ACTIVITY
    // =============================================

    const registerActivity = () => {
      if (
        logoutStartedRef.current
      ) {
        return;
      }


      const activityTime =
        Date.now();


      lastActivityRef.current =
        activityTime;


      localStorage.setItem(
        LAST_ACTIVITY_KEY,
        String(activityTime)
      );


      scheduleLogout();
    };


    // =============================================
    // SYNC MULTIPLE BROWSER TABS
    // =============================================

    const handleStorageChange = (
      event
    ) => {
      if (
        event.key === "token" &&
        !event.newValue
      ) {
        setUnauthorized(true);
        return;
      }


      if (
        event.key ===
          LAST_ACTIVITY_KEY &&
        event.newValue
      ) {
        const activityTime =
          Number(
            event.newValue
          );


        if (
          Number.isFinite(
            activityTime
          )
        ) {
          lastActivityRef.current =
            activityTime;

          scheduleLogout();
        }
      }
    };


    // =============================================
    // USER ACTIVITY EVENTS
    // =============================================

    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];


    activityEvents.forEach(
      (eventName) => {
        window.addEventListener(
          eventName,
          registerActivity,
          {
            passive: true,
          }
        );
      }
    );


    window.addEventListener(
      "storage",
      handleStorageChange
    );


    scheduleLogout();


    // =============================================
    // CLEANUP
    // =============================================

    return () => {
      if (
        timeoutRef.current
      ) {
        clearTimeout(
          timeoutRef.current
        );
      }


      activityEvents.forEach(
        (eventName) => {
          window.removeEventListener(
            eventName,
            registerActivity
          );
        }
      );


      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };

  }, [
    token,
    unauthorized,
    sessionTimeoutMinutes,
  ]);


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight:
            "100vh",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#f5f7fa",

          color:
            "#4c1d95",

          fontFamily:
            "Arial, Helvetica, sans-serif",
        }}
      >
        Checking access...
      </div>
    );
  }


  // =====================================================
  // NOT AUTHENTICATED
  // =====================================================

  if (
    unauthorized ||
    !token
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  // =====================================================
  // NO MODULE PERMISSION
  // =====================================================

  if (!allowed) {
    return (
      <Navigate
        to="/access-denied"
        replace
      />
    );
  }


  // =====================================================
  // ACCESS GRANTED
  // =====================================================

  return children;
}


export default ProtectedRoute;
