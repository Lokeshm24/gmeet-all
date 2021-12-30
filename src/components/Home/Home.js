import React from "react";

import axios from "axios";
import { useGoogleLogin, useGoogleLogout } from "react-google-login";
import { useCallback, useEffect, useState } from "react";
import { addDays, format, isAfter, isValid } from "date-fns";
import { useGoogleOneTapLogin } from "react-google-one-tap-login";

import "../../style.css";

export const Home = () => {
  const [data, setData] = useState(null);
  // const [calendarData, setCalendarData] = useState({});
  const [showDeclined, setShowDeclined] = useState(false);
  const [auth, setAuth] = useState(null);

  // const fetchData = useCallback(async (accessToken) => {
  //   try {
  //     const { data } = await axios.get(
  //       "https://www.googleapis.com/calendar/v3/users/me/calendarList",
  //       {
  //         headers: {
  //           Authorization: "Bearer " + accessToken,
  //         },
  //       }
  //     );
  //     setCalendarData({ accessToken: data });
  //   } catch (e) {}
  // }, []);

  const fetchCalendarData = useCallback(async (accessToken) => {
    try {
      const { data } = await axios.get(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${new Date(
          new Date().setHours(0, 0, 0, 0)
        ).toISOString()}&timeMax=${addDays(new Date().setHours(0, 0, 0, 0), 4).toISOString()}`,
        {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        }
      );
      setData((d) =>
        data.items.reduce((acc, curr) => {
          const date = format(new Date(curr.start.dateTime), "MM/dd/yy");
          acc[date] = {
            label: date,
            items: [...(acc[date]?.items ?? []), curr, ...(d?.[date]?.items ?? [])]
              .filter((value, index, self) => self.findIndex(({ id }) => id === value.id) === index)
              .sort((a, b) =>
                isAfter(new Date(a.start.dateTime), new Date(b.start.dateTime)) ? 1 : -1
              ),
          };
          return acc;
        }, {})
      );
    } catch (e) {
      console.error("Error in fetching events", e);
    }
  }, []);

  // useEffect(() => {
  //   fetchData();
  // }, [fetchData]);

  const onSuccess = (param) => {
    setAuth(param?.tokenObj?.session_state?.extraQueryParams?.authuser ?? null);
    // fetchData(param.accessToken);
    fetchCalendarData(param.accessToken);
  };

  const onFailure = (param) => {
    console.log("failure", param);
  };

  const joinMeet = (meetingLink) => {
    const w = window.open(
      meetingLink,
      "MsgWindow",
      "width=2000,height=750,top=100,status=0,menubar=0,location=0,titlebar=0,toolbar=0"
    );
    if (w.requestFullscreen) {
      w.requestFullscreen();
    } else if (w.webkitRequestFullscreen) {
      /* Safari */
      w.webkitRequestFullscreen();
    } else if (w.msRequestFullscreen) {
      /* IE11 */
      w.msRequestFullscreen();
    }
  };

  const { signIn } = useGoogleLogin({
    onSuccess,
    onFailure,
    clientId: `452890721843-bvp31s2cq988jsiu9mlh83elp7cs8s1u.apps.googleusercontent.com`,
    isSignedIn: true,
    accessType: "online",
    // discoveryDocs: [
    //   "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    // ],
    // fetchBasicProfile: true,
    // hostedDomain: "https://gmeet-all.vercel.app",
    // responseType: "permission id_token",
    // redirectUri: "storagerelay://https/gmeet-all.vercel.app?id=auth433992",
    scope: "https://www.googleapis.com/auth/calendar",
    // responseType: "code",
    // prompt: "consent",
  });

  useGoogleOneTapLogin({
    onError: (error) => console.log(error),
    onSuccess: (response) => console.log(response),
    googleAccountConfigs: {
      client_id: `452890721843-bvp31s2cq988jsiu9mlh83elp7cs8s1u.apps.googleusercontent.com`,
    },
  });
  return (
    <div>
      <div className="header">
        <div style={{ display: "flex" }}>
          <label class="checkbox-wrapper">
            Show declined
            <input
              type="checkbox"
              onChange={() => setShowDeclined((prev) => !prev)}
              checked={showDeclined}
            />
            <span class="checkmark"></span>
          </label>
          <button onClick={signIn} className="primary-btn">
            Login
          </button>
        </div>
      </div>
      <div style={{ display: "grid" }}></div>

      {data &&
        Object.values(data)?.map(({ label, items }) => (
          <div key={label}>
            {/* check if day doesn't only contain declined events */}
            {(showDeclined ||
              items.filter(
                (item) =>
                  !item.attendees.some(
                    ({ self, responseStatus }) => self && responseStatus === "declined"
                  )
              ).length > 0) && (
              <h2>
                {format(new Date(), "MM/dd/yy") === label
                  ? "Today"
                  : format(new Date(label), "iiii")}
              </h2>
            )}
            <table>
              <tbody>
                {items?.map((item) =>
                  // if showDeclined state is false then filter out declined events
                  showDeclined ||
                  !item.attendees.some(
                    ({ self, responseStatus }) => self && responseStatus === "declined"
                  ) ? (
                    <tr key={item.id}>
                      <td>{item.summary} </td>
                      <td>
                        &nbsp; &nbsp; &nbsp;
                        {isValid(new Date(item.start?.dateTime)) &&
                          format(new Date(item.start?.dateTime), "dd/MM/yy hh:mm a")}{" "}
                        -{" "}
                        {isValid(new Date(item.end?.dateTime)) &&
                          format(new Date(item.end?.dateTime), "hh:mm a")}
                        &nbsp; &nbsp; &nbsp;
                      </td>
                      <td>
                        {item.hangoutLink && (
                          <button
                            onClick={() =>
                              joinMeet(item.hangoutLink + (auth ? `?authuser=${auth}` : ""))
                            }
                          >
                            Join
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : null
                )}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
};
