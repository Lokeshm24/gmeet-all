import axios from "axios";
import { useGoogleLogin, useGoogleLogout } from "react-google-login";
import { useCallback, useEffect, useState } from "react";
import { addDays, format, isValid } from "date-fns";

export default function App() {
  const [data, setData] = useState(null);
  const [calendarData, setCalendarData] = useState({});
  const [showDeclined, setShowDeclined] = useState(false);

  const fetchData = useCallback(async (accessToken) => {
    try {
      const { data } = await axios.get(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        }
      );
      setCalendarData({ accessToken: data });
    } catch (e) {}
  }, []);

  const fetchCalendarData = useCallback(async (accessToken) => {
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
            Authorization: "Bearer " + accessToken,
          },
        }
      );
      setData(
        data.items.reduce((acc, curr) => {
          const date = format(new Date(curr.start.dateTime), "MM/dd/yy");
          acc[date] = {
            label: date,
            items: [...(acc[date]?.items ?? []), curr],
          };
          return acc;
        }, {})
      );
    } catch (e) {
      console.log(e);
    }
  }, []);

  // useEffect(() => {
  //   fetchData();
  // }, [fetchData]);

  const onSuccess = (param) => {
    fetchData(param.accessToken);
    fetchCalendarData(param.accessToken);
  };

  const onFailure = (param) => {
    console.log("failure", param);
  };

  const joinMeet = (meetingLink) => {
    window.open(
      meetingLink,
      "MsgWindow",
      "width=2000,height=750,top=100,status=0,menubar=0,location=0,titlebar=0,toolbar=0"
    );
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

  return (
    <div className="App">
      <div style={{ display: "flex" }}>
        <button onClick={signIn}>Login</button>
        <label
          style={{ display: "flex", marginLeft: "20px", cursor: "pointer" }}
        >
          <input
            type="checkbox"
            onChange={() => setShowDeclined((prev) => !prev)}
            checked={showDeclined}
          />
          Show declined
        </label>
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
                        {isValid(new Date(item.start?.dateTime)) &&
                          format(
                            new Date(item.start?.dateTime),
                            "dd/MM/yy hh:mm a"
                          )}
                      </td>
                      <td>
                        {item.hangoutLink && (
                          <button onClick={() => joinMeet(item.hangoutLink)}>
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
