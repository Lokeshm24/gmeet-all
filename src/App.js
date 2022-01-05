import axios from "axios";
import { useGoogleLogin, useGoogleLogout } from "react-google-login";
import { useCallback, useEffect, useState } from "react";
import { addDays, format, isAfter, isValid } from "date-fns";
import { useGoogleOneTapLogin } from "react-google-one-tap-login";

let users = [];
export default function App() {
  const [data, setData] = useState(null);
  // const [calendarData, setCalendarData] = useState({});
  const [showDeclined, setShowDeclined] = useState(false);
  const [link, setLink] = useState("");

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

  const fetchCalendarData = useCallback(async (auth) => {
    try {
      const { data } = await axios.get(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${new Date(
          new Date().setHours(0, 0, 0, 0)
        ).toISOString()}&timeMax=${addDays(
          new Date().setHours(0, 0, 0, 0),
          4
        ).toISOString()}`,
        {
          headers: {
            Authorization: "Bearer " + auth.token,
          },
        }
      );
      setData((d) =>
        data.items
          .map((item) => ({ ...item, ...auth }))
          .reduce((acc, curr) => {
            const date = format(new Date(curr.start.dateTime), "MM/dd/yy");
            acc[date] = {
              label: date,
              items: [
                ...(acc[date]?.items ?? []),
                curr,
                ...(d?.[date]?.items ?? []),
              ]
                .filter(
                  (value, index, self) =>
                    self.findIndex(({ id }) => id === value.id) === index
                )
                .sort((a, b) =>
                  isAfter(
                    new Date(a.start.dateTime),
                    new Date(b.start.dateTime)
                  )
                    ? 1
                    : -1
                ),
            };
            return acc;
          }, {})
      );
    } catch (e) {
      console.error("Error in fetching events", e);
    }
  }, []);

  const onSuccess = (param) => {
    // fetchData(param.accessToken);
    const token = localStorage.getItem("accessToken");
    const accessToken = token ? JSON.parse(token) : [];

    const authObj = {
      token: param.accessToken,
      email: param?.profileObj?.email,
      auth: param?.tokenObj?.session_state?.extraQueryParams?.authuser,
    };

    const authArr = [authObj, ...accessToken];
    users = authArr;

    localStorage.setItem("accessToken", JSON.stringify(authArr));

    fetchCalendarData(authObj);
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

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const accessToken = token ? JSON.parse(token) : [];
    accessToken.forEach(fetchCalendarData);
    users = accessToken;
  }, []);

  const { signIn } = useGoogleLogin({
    onSuccess,
    onFailure,
    clientId: `452890721843-bvp31s2cq988jsiu9mlh83elp7cs8s1u.apps.googleusercontent.com`,
    isSignedIn: false,
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
    <div className="App">
      <div style={{ display: "flex" }}>
        <button onClick={signIn}>Login</button>
        <label style={{ display: "flex", margin: "0 20px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showDeclined}
            onChange={() => setShowDeclined((prev) => !prev)}
          />
          Show declined
        </label>
        <input
          value={link}
          placeholder="Enter Meet Link"
          onChange={(e) => setLink(e.target.value)}
        />
        {users.map((user) => (
          <button
            type="button"
            key={user.email}
            onClick={() => {
              joinMeet(
                link.split("?")?.[0] +
                  (user.auth ? `?authuser=${user.auth}` : "")
              );
              setLink("");
            }}
          >
            Join {user.email}
          </button>
        ))}
      </div>
      <div>
        <h2>New Meeting</h2>
        {users.map((user) => (
          <div key={user.email} style={{ marginBottom: "10px" }}>
            <button
              onClick={() =>
                joinMeet(
                  `https://meet.google.com/new${
                    user.auth ? `?authuser=${user.auth}` : ""
                  }`
                )
              }
            >
              {user.email}
            </button>
          </div>
        ))}
      </div>
      {data &&
        Object.values(data)?.map(({ label, items }) => (
          <div key={label}>
            {/* check if day doesn't only contain declined events */}
            {(showDeclined ||
              items.filter(
                (item) =>
                  !item.attendees.some(
                    ({ self, responseStatus }) =>
                      self && responseStatus === "declined"
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
                    ({ self, responseStatus }) =>
                      self && responseStatus === "declined"
                  ) ? (
                    <tr key={item.id}>
                      <td>{item.summary} </td>
                      <td>
                        &nbsp; &nbsp; &nbsp;
                        {isValid(new Date(item.start?.dateTime)) &&
                          format(
                            new Date(item.start?.dateTime),
                            "dd/MM/yy hh:mm a"
                          )}{" "}
                        -{" "}
                        {isValid(new Date(item.end?.dateTime)) &&
                          format(new Date(item.end?.dateTime), "hh:mm a")}
                        &nbsp; &nbsp; &nbsp;
                      </td>
                      <td>
                        {item.hangoutLink && (
                          <button
                            onClick={() =>
                              joinMeet(
                                item.hangoutLink +
                                  (item.auth ? `?authuser=${item.auth}` : "")
                              )
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
}
