import React, { useState, useEffect } from "react";
import { connect } from "dva";
import { message, Input, Badge } from "antd";
import dayJS from "dayjs";

import styles from "./index.less";
import defaultAvatar from "../../assets/avatar.png";

const { TextArea } = Input;

const HomePage = ({
  dispatch,
  JIM,
  JIMUserInfo,
  chatInfo,
  conversationList,
  allChatList,
  currChatList,
}) => {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getUserInfo();
  }, []);

  // 获取登录用户信息
  const getUserInfo = () => {
    if (JIM && JIMUserInfo.username) {
      JIM.getUserInfo({
        username: JIMUserInfo.username,
      })
        .onSuccess((data) => {
          dispatch({
            type: "jim/updateJIMUserInfo",
            payload: data.user_info,
          });

          getSyncConversation();
          getConversation();
          onMsgReceive();
        })
        .onFail((data) => {
          message.error("获取用户信息失败");
        });
    }
  };

  const getSyncConversation = () => {
    // 获取离线消息列表
    JIM.onSyncConversation((data) => {
      dispatch({
        type: "jim/updateAllChatList",
        payload: data,
      });
    });
  };

  // 监听聊天消息
  const onMsgReceive = () => {
    if (JIM) {
      JIM.onMsgReceive((data) => {
        dispatch({
          type: "jim/receiveNewMessage",
          payload: data,
        });
        getConversation();
        scrollToBottom();
      });
    }
  };

  // 获取用户会话列表
  const getConversation = () => {
    if (JIM) {
      JIM.getConversation()
        .onSuccess((data) => {
          dispatch({
            type: "jim/updateConversationList",
            payload: data.conversations || [],
          });
        })
        .onFail((data) => {
          message.error("获取会话列表失败");
        });
    }
  };

  // 更新当前聊天列表
  const updateChatList = (withCurrUserMessages) => {
    if (withCurrUserMessages && withCurrUserMessages.length > 0) {
      const chatList = withCurrUserMessages[0].msgs.map((item) => {
        const content = item.content;
        if (content.target_id === JIMUserInfo.username) {
          return {
            msg_id: item.msg_id,
            type: item.msg_type, // 消息主体类型 3：单聊， 4： 群聊
            ...content,
            showType: "from",
          };
        }
        return {
          msg_id: item.msg_id,
          type: item.msg_type, // 消息主体类型 3：单聊， 4： 群聊
          ...content,
          showType: "to",
        };
      });

      dispatch({
        type: "jim/updateCurrChatList",
        payload: chatList || [],
      });

      scrollToBottom();
    }
  };

  // 切换聊天对象
  const handleChangeChatUser = (data) => {
    getUserInfo();
    dispatch({
      type: "jim/updateChatInfo",
      payload: data || {},
    });
    const withCurrUserMessages = allChatList.filter(
      (chat) => chat.from_username === data.username
    );
    updateChatList(withCurrUserMessages);
  };

  // 发送单聊消息
  const sendSingleMessage = (type) => {
    if (!msg) {
      message.warning("请输入消息内容");
      return;
    }
    if (JIM && type === "text") {
      JIM.sendSingleMsg({
        target_username: chatInfo.username,
        content: msg,
      })
        .onSuccess((data, msg) => {
          dispatch({
            type: "jim/addChatItemForList",
            payload: msg || {},
          });
          setMsg("");
          scrollToBottom();
        })
        .onFail((data) => {});
    }
    if (JIM && type === "img") {
      JIM.sendSinglePic()
        .onSuccess((data, msg) => {})
        .onFail((data) => {});
    }
  };

  // 滑倒底部
  const scrollToBottom = () => {
    setTimeout(() => {
      var div = document.getElementById("messages");
      div.scrollTop = div.scrollHeight;
    }, 100);
  };

  // 键盘事件监听
  const handleKeyEvent = (e) => {
    const keyCode = e.keyCode;
    if (e.shiftKey && keyCode === 13) {
      e.preventDefault();
      setMsg(msg + "\n");
    }
    if (!e.shiftKey && keyCode === 13) {
      sendSingleMessage("text");
    }
  };

  return (
    <div className={styles.home}>
      <div className={styles.left}>
        <div className={styles.title}>聊天列表</div>
        <div className={styles.list}>
          {conversationList.map((item, index) => (
            <div
              key={index}
              className={
                item.username === chatInfo.username
                  ? `${styles.active} ${styles.listItem}`
                  : `${styles.listItem}`
              }
              onClick={() => handleChangeChatUser(item)}
            >
              <Badge
                count={item.unread_msg_count}
                size={"small"}
                offset={[-5, 5]}
              >
                <img src={item.avatar || defaultAvatar} alt={""} />
              </Badge>
              <div className={styles.info}>
                <div className={styles.name}>
                  <span className={`${styles.ellipsis_1} ${styles.nameTit}`}>
                    {item.nickName}
                  </span>
                  <span className={styles.time}>
                    {item.type === 3 ? "单聊" : item.type === 4 ? "群聊" : ""}
                  </span>
                </div>
                <div className={`${styles.ellipsis_1} ${styles.message}`}>
                  {dayJS(item.mtime).format("YYYY/MM/DD HH:mm:ss")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.title}>{chatInfo.nickName}</div>
        <div className={styles.container}>
          <div id={"messages"} className={styles.messages}>
            {currChatList.map((item) => {
              return (
                <div className={styles[item.showType]} key={item.msg_id}>
                  {item.showType === "from" ? (
                    <img
                      className={styles.avatar}
                      src={chatInfo.avatar || defaultAvatar}
                      alt={""}
                    />
                  ) : null}
                  <div className={styles.content}>
                    <div className={styles.name}>{item.from_id}</div>
                    <div className={styles.msgBody}>{item.msg_body.text}</div>
                  </div>
                  {item.showType === "to" ? (
                    <img
                      className={styles.avatar}
                      src={JIMUserInfo.avatar || defaultAvatar}
                      alt={""}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className={styles.operator}>
            <TextArea
              disabled={!chatInfo.username}
              value={msg}
              placeholder="消息内容"
              bordered={false}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={handleKeyEvent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default connect(({ jim }) => ({
  JIM: jim.JIM,
  JIMUserInfo: jim.JIMUserInfo,
  chatInfo: jim.chatInfo,
  conversationList: jim.conversationList,
  allChatList: jim.allChatList,
  currChatList: jim.currChatList,
  receiveList: jim.receiveList,
}))(HomePage);
