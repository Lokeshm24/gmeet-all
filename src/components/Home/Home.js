import React from "react";
import { format, isValid } from "date-fns";
import "../../style.css";

export const Home = ({ showDeclined, setShowDeclined, signIn, data }) => {
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
