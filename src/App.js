import axios from "axios";
import { useGoogleLogin, useGoogleLogout } from "react-google-login";
import { useCallback, useEffect } from "react";

export default function App() {
  const fetchData = useCallback(async () => {
    try {
      const { data } = await axios.get(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList"
      );
      console.log(data);
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSuccess = (param) => {
    console.log("success", param);
  };

  const onFailure = (param) => {
    console.log("failure", param);
  };

  const { signIn } = useGoogleLogin({
    onSuccess,
    onFailure,
    clientId: `452890721843-bvp31s2cq988jsiu9mlh83elp7cs8s1u.apps.googleusercontent.com`,
    isSignedIn: false,
    accessType: "offline",
    discoveryDocs: [
      "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    ],
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    // responseType: "code",
    // prompt: "consent",
  });

  // useEffect(() => {
  //   function start() {
  //     // 2. Initialize the JavaScript client library.
  //     gapi.client
  //       .init({
  //         apiKey: "YOUR_API_KEY",
  //         // clientId and scope are optional if auth is not required.
  //         clientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
  //         scope: "profile"
  //       })
  //       .then(function () {
  //         // 3. Initialize and make the API request.
  //         return gapi.client.request({
  //           path:
  //             "https://people.googleapis.com/v1/people/me?requestMask.includeField=person.names"
  //         });
  //       })
  //       .then(
  //         function (response) {
  //           console.log(response.result);
  //         },
  //         function (reason) {
  //           console.log("Error: " + reason.result.error.message);
  //         }
  //       );
  //   }
  //   // 1. Load the JavaScript client library.
  //   gapi.load("client", start);
  // }, []);

  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <button onClick={signIn}>Google</button>
    </div>
  );
}
