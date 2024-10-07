import "./App.css";
import React, { useEffect, useState } from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import alertFn from "./tool/alert-tips";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";

import Terminal from "./terminal/index";
import CustomPopup from "./components/customPopup/popup";
import axios from "axios";


const App = () => {
  const [isShowTerminal, setIsShowTerminal] = useState(false);
  const [terminalMessage, setTerminalMessage] = useState([]);

  const [terminal, setTerminal] = useState({
    keys: [],
    messages: [],
  });
  const [questions, setQuestions] = useState({
    question: [],
    options: [],
  });
  const options = ["a", "b", "c", "d"];

  useEffect(() => {
    fetch("/question.json")
      .then((res) => res.json())
      .then((res) => {
        setQuestions(res);
      });
    fetch("/terminal.json")
      .then((res) => res.json())
      .then((res) => {
        setTerminal(res);
      });
  }, []);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [isShowPopupDisplayed, setIsShowPopupDisplayed] = useState(false);
  const [isShowPopup, setIsShowPopup] = useState(true);

  // Define status and finimg in the component's state
  const [status, setStatus] = useState(0);
  const [findimg, setFindimg] = useState("");
  function splitSentences(responseText) {
    const parts = responseText.split(/(\[.*?\])/g);
    const messages = [];
    let currentMessage = "";

    for (const part of parts) {
      if (part.startsWith("[")) {
        if (currentMessage.trim()) {
          messages.push(currentMessage.trim());
          currentMessage = "";
        }
        currentMessage += part;
      } else {
        currentMessage += part;
      }
    }

    if (currentMessage.trim()) {
      messages.push(currentMessage.trim());
    }

    return messages;
  }

  const handleSend = async (message) => {
    setMessage("");
    setIsShowTerminal(() => false);

    const newMessage = {
      message: message,
      sender: "user",
      direction: "outgoing",
    };

    // new array of messages
    const newMessages = [...messages, newMessage];

    // Update our messages state
    setMessages(newMessages);

    // Set a typing indicator (Ryno is typing...)
    setTyping(true);

    if (password === "") return;

    try {
      // Send the message to the API
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          password: password,
          message: message,
        }),
      };

      const apiResponse = await fetch(
        "https://ryno-v2-cedo4cgxka-de.a.run.app/message",
        requestOptions
      );

      if (!apiResponse.ok) {
        console.log(apiResponse.statusText);
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();

      console.log("test", questions);
      // Add an additional check]

      if (data && data.response.hasOwnProperty("question")) {
        // If responses are received from the server, treat it as a multi-selection question
        const questionIndex = questions.question.indexOf(
          data.response.question
        );
        console.log(questions.options[questionIndex]);

        const newMessage = {
          sender: "Ryno",
          direction: "incoming",
          message: data.response.question,
          choices: questions.options[questionIndex],
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setTyping(false);
      } else if (data && data.response) {
        // If single response, convert it to an array containing single element
        let responses = Array.isArray(data.response)
          ? data.response
          : [data.response];

        // Apply split sentences on each response
        responses = responses.flatMap((response) => splitSentences(response));

        const sendSeparatedMessages = async () => {
          for (const message of responses) {
            setTyping(true);
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Call image api only when status is set to 1
            if (status === 1) {
              try {
                const res = await axios.get(
                  "https://2dde-115-208-95-142.jp.ngrok.io/picture/in?message=" +
                    findimg
                );
                // const res = {};

                // If we obtained data, add image messsage and set status to 0
                if (res.data && status === 1) {
                  console.log("return value judgment：", res);
                  const newMessageWithChatGPT1 = {
                    message:
                      "<img width='250'  height='250' src='https://2dde-115-208-95-142.jp.ngrok.io/picture/getjpg1?message=" +
                      findimg +
                      "'/>",
                    sender: "ChatGPT",
                    direction: "ingoing",
                  };
                  setMessages((prevMessages) => [
                    ...prevMessages,
                    newMessageWithChatGPT1,
                  ]);
                  setStatus(0);
                }
              } catch (err) {
                console.log(err);
              }
            }

            const newMessageWithChatGPT = {
              message: message,
              sender: "ChatGPT",
              direction: "ingoing",
            };

            setMessages((prevMessages) => [
              ...prevMessages,
              newMessageWithChatGPT,
            ]);
            setTyping(false);
          }
        };

        await sendSeparatedMessages();
        setTyping(false);

        for (const item of responses) {
          const sleep = (time = 1000) => {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                resolve();
              }, time);
            });
          };

          const terminalIndex = item.indexOf(terminal.keys[0]);
          console.log(terminalIndex, item, terminal.keys[0]);
          if (terminalIndex != -1) {
            document
              .querySelector("input#input")
              .setAttribute("disabled", true);
            document.querySelector("input#input").value = "";
            setIsShowTerminal(() => true);

            const addTerminal = async () => {
              for (const text of terminal.messages[terminalIndex]) {
                await sleep(1000);
                setTerminalMessage((pre) => {
                  return [...pre, { it: true, text }];
                });
              }
            };
            addTerminal();
          }
        }
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };
  const closePopup = async (userId, passwordFromUserInput, isLogin) => {
    // store user_id
    setUserId(userId);

    // Only login button execution
    if (isLogin) {
      const closeFn = alertFn({ title: "Loading...", customControl: true });
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          password: passwordFromUserInput,
          message: "",
        }),
      };

      try {
        const apiResponse = await fetch(
          "https://ryno-v2-cedo4cgxka-de.a.run.app/message",
          requestOptions
        );
        const data = await apiResponse.json();

        // Login failed
        if (!apiResponse.ok) {
          closeFn();
          alertFn({ title: data.detail, textColor: "#e56c5e" });
          throw new Error(data.message);
        }

        closeFn();
        alertFn({ title: "Login success!", textColor: "#359d5a" });
        // close the popup
        setPassword(passwordFromUserInput);
        setIsShowPopup(false);
        setIsShowPopupDisplayed(true); // <-- once done with login/registration, set this to false
        document.querySelector("#input").focus();
      } catch (error) {
        if (error === "TypeError: Failed to fetch") {
          closeFn();
          alertFn({ title: "Account does not exist", textColor: "#e56c5e" });
        }
        closeFn();
      }
    } else {
      registerFn(userId, passwordFromUserInput);
    }
  };

  const registerFn = async (userId, passwordFromUserInput) => {
    // Call registration API
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        password: passwordFromUserInput,
      }),
    };

    try {
      const response = await fetch(
        "https://ryno-v2-cedo4cgxka-de.a.run.app/register",
        requestOptions
      );
      const data = await response.json();

      // Creation failed
      if (!response.ok) {
        alertFn({ title: data.detail, textColor: "#e56c5e" });
        throw new Error(data.message);
      }

      if (data.message.startsWith("Your user account has been created.")) {
        alertFn({ title: data.message, textColor: "#359d5a" });
        alertFn({ title: "Start chat with Ryno！", textColor: "#359d5a" });
        // new user, password generated on server and returned in response
        setPassword(passwordFromUserInput); // parsing password from "Your user account has been created. Your password is: {password}."

        setIsShowPopup(false);
        setIsShowPopupDisplayed(true); // <-- once done with login/registration, set this to false
      }
    } catch (err) {
      // console.error("Registration failed: ", err === "TypeError: Failed to fetch");
      console.log(
        err,
        err.toString(),
        err.toString() === "TypeError: Failed to fetch"
      );

      if (err.toString() === "TypeError: Failed to fetch") {
        alertFn({ title: "Error", textColor: "#e56c5e" });
      }
      // re-display the popup if registration/login fails
      setIsShowPopupDisplayed(false);
      return; // if registration/login fails, stop executing function
    }
  };

  return (
    <>
      <div className="chatBox">
        {!isShowPopupDisplayed && (
          <CustomPopup isShow={isShowPopup} closeEvent={closePopup} />
        )}
        <div className="headerBox">
          <div className="header">
            <div>
              <img src="/profile picture.png" alt="" /> <div>Ryno</div>
            </div>
            <div>
              <img src="/phoneandvideo.png" alt="" srcSet="" />
            </div>
          </div>
        </div>
        <div style={{ width: "100%", height: "0%", flex: "1" }}>
          <MainContainer>
            <ChatContainer>
              <MessageList
                typingIndicator={
                  typing ? (
                    <TypingIndicator content="Ryno is typing..." />
                  ) : null
                }
              >
                {messages.map((message, messageIndex) => {
                  // Check if message has choices or not
                  if (message.choices) {
                    // Render question as normal chat bubble and choices as buttons
                    return (
                      <React.Fragment key={messageIndex}>
                        <Message model={message} />
                        <div>
                          {message.choices.map((choice, choiceIndex) => {
                            return (
                              <div
                                className="message-choice"
                                key={`${messageIndex}-${choiceIndex}`}
                                onClick={() => setMessage(choice)}
                              >
                                <p>{choice}</p>
                              </div>
                            );
                          })}
                        </div>
                      </React.Fragment>
                    );
                  }
                  return <Message key={messageIndex} model={message} />;
                })}
              </MessageList>

              {/* <MessageInput placeholder='Type a message here...' onSend={handleSend} /> */}
            </ChatContainer>
            {isShowTerminal && <Terminal terminalMessage={terminalMessage} />}
          </MainContainer>
        </div>
        <div>
          <form className="inputForm">
            {/* <p id="mention">
            {" "}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 
          </p> */}
            <div className="inputBox">
              <div className="leftIcon">
                <img src="/camera.png" />
              </div>
              <input
                id="input"
                type="text"
                placeholder={
                  userId
                    ? "Please input your message"
                    : "Please input your id first"
                }
                value={message}
                onFocus={(e) => {
                  if (!isShowPopupDisplayed) {
                    document.querySelector("#input").blur();
                    setIsShowPopup(true);
                  }
                }}
                onChange={(e) => setMessage(e.target.value)}
              />

              <div className="rightIcon">
                <img src="/microphone.png" />
                <img src="/pic.png" />
                {/* <img src="/icons/smail.png" /> */}
                <input
                  className=""
                  id="button"
                  type="submit"
                  value="Send"
                  onClick={(e) => {
                    e.preventDefault();
                    if (message === "") return;
                    setFindimg(message);
                    setStatus(1);
                    handleSend(message);
                    document.querySelector("#input").focus();
                  }}
                />
              </div>
            </div>
          </form>
        </div>
        {/* <p>Response: {response}</p> */}

        <div className="alert-tips-box"></div>
      </div>
    </>
  );
};

export default App;
