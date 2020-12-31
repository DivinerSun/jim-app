import md5 from "md5";
import randomString from "crypto-random-string";
import { routerRedux } from "dva/router";
import { pathToRegexp } from "path-to-regexp";
import _ from "lodash";
import configs from "../configs";

export default {
  namespace: "jim",

  state: {
    JIM: null,
    // 登录用户信息
    JIMUserInfo: {},
    // 聊天用户信息
    chatInfo: {},
    // 会话列表
    conversationList: [],
    // 离线消息列表
    allChatList: [],
    // 消息渲染列表
    currChatList: [],
    // 实时消息列表
    receiveList: [],
  },

  subscriptions: {
    setup({ dispatch, history }) {
      history.listen((location) => {
        const { pathname } = location;
        const matchLogin = pathToRegexp("/login").exec(pathname);
        const matchHome = pathToRegexp("/home").exec(pathname);
        if (matchLogin) {
          dispatch({
            type: "init",
          });
        }
        if (matchHome) {
          dispatch({
            type: "home",
          });
        }
      });
    },
  },

  effects: {
    *init({ payload }, { call, put, select }) {
      const jimState = yield select((state) => state.jim);
      const { JIM } = jimState;
      let NewJIM = null;
      const JMessage = window.JMessage;
      const initParams = {
        appkey: configs.appkey,
        random_str: randomString({ length: 32 }),
        timestamp: new Date().getTime(),
        flag: 1,
      };
      const signature = md5(
        `appkey=${configs.appkey}&timestamp=${initParams.timestamp}&random_str=${initParams.random_str}&key=${configs.secret}`
      );
      if (!JIM) {
        NewJIM = new JMessage();
        NewJIM.init({
          ...initParams,
          signature,
        })
          .onSuccess(function (data) {
            console.log("Init Success: ", data);
          })
          .onFail(function (data) {
            console.log("Init Fail: ", data);
          });
      } else {
        NewJIM = JIM;
      }
      yield put({ type: "updateJIM", payload: { JIM: NewJIM } });
    },
    *home({ payload }, { put, select }) {
      const jimState = yield select((state) => state.jim);
      const { JIM } = jimState;
      if (!JIM) {
        yield put(routerRedux.push("/"));
      } else if (JIM && !JIM.isLogin()) {
        yield put(routerRedux.push("/"));
      }
    },
    *addChatItemForList({ payload: msg }, { put, select }) {
      const jimState = yield select((state) => state.jim);
      const { currChatList } = jimState;
      const content = msg.content;
      const newMsg = {
        msg_id: msg.msg_id,
        type: 3, // 消息主体类型 3：单聊， 4： 群聊
        ...content,
        showType: "to",
      };
      yield put({
        type: "updateCurrChatList",
        payload: [...currChatList, newMsg],
      });
    },
    *receiveNewMessage({ payload: msgs }, { put, select }) {
      const jimState = yield select((state) => state.jim);
      const { currChatList, chatInfo, receiveList } = jimState;
      yield put({
        type: "updateReceiveList",
        payload: [...receiveList, ..._.get(msgs, "messages", [])],
      });
      let newMsg;
      _.map(_.get(msgs, "messages", []), (item) => {
        if (!_.isEmpty(chatInfo) && item.from_username === chatInfo.username) {
          const content = item.content;
          newMsg = {
            msg_id: item.msg_id,
            type: item.msg_type, // 消息主体类型 3：单聊， 4： 群聊
            ...content,
            showType: "from",
          };
          return newMsg;
        }
      });
      if (newMsg) {
        yield put({
          type: "updateCurrChatList",
          payload: [...currChatList, newMsg],
        });
      }
    },
    *logout({ payload }, { put, select }) {
      const jimState = yield select((state) => state.jim);
      const { JIM } = jimState;
      if (JIM) {
        JIM.loginOut();
        yield put(
          routerRedux.push({
            pathname: "/",
          })
        );
      }
    },
  },

  reducers: {
    updateJIM(state, { payload }) {
      const { JIM } = payload;
      return { ...state, JIM };
    },
    updateJIMUserInfo(state, { payload: JIMUserInfo }) {
      return { ...state, JIMUserInfo };
    },
    updateChatInfo(state, { payload: chatInfo }) {
      return { ...state, chatInfo };
    },
    updateConversationList(state, { payload: conversationList }) {
      return { ...state, conversationList };
    },
    updateAllChatList(state, { payload: allChatList }) {
      return { ...state, allChatList };
    },
    updateCurrChatList(state, { payload: currChatList }) {
      return { ...state, currChatList };
    },
    updateReceiveList(state, { payload: receiveList }) {
      return { ...state, receiveList };
    },
  },
};
