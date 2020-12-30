import React, { useState } from "react";
import { connect } from "dva";
import { Button, Form, Input, message, Modal } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

import styles from "./index.less";

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

const IndexPage = ({ dispatch, history, JIM }) => {
  const [type, setType] = useState("login");
  const [form] = Form.useForm();

  const changType = (type) => {
    setType(type);
    form.resetFields();
  };

  const login = (values) => {
    const { username, password } = values;
    if (JIM && !JIM.isLogin()) {
      JIM.login({
        username: username,
        password: password,
      })
        .onSuccess((data) => {
          message.success("登录成功");
          dispatch({
            type: "jim/updateJIMUserInfo",
            payload: { username: data.username },
          });
          history.push({
            pathname: "/home",
          });
        })
        .onFail(function (data) {
          message.error("用户名或密码错误");
        });
    }
  };
  const register = (values) => {
    const { username, password } = values;
    if (JIM) {
      JIM.register({
        username,
        password,
      })
        .onSuccess(function (data) {
          Modal.success({
            content: "账户注册成功",
            okText: "知道了",
            centered: true,
            onOk: () => setType("login"),
          });
        })
        .onFail(function (data) {
          message.success("注册失败");
        });
    }
  };
  return (
    <div className={styles.index}>
      {type === "login" ? (
        <div className={styles.login}>
          <Form
            {...layout}
            name="basic"
            initialValues={{ remember: true }}
            onFinish={login}
          >
            <Form.Item
              label=""
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              label=""
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密 码"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item label="">
              <span className={styles.info}>
                <span>暂无账号？</span>
                <span
                  className={styles.opt}
                  onClick={() => changType("register")}
                >
                  去注册
                </span>
              </span>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className={styles.btn}>
                登 录
              </Button>
            </Form.Item>
          </Form>
        </div>
      ) : (
        <div className={styles.login}>
          <Form
            {...layout}
            name="basic"
            initialValues={{ remember: true }}
            onFinish={register}
          >
            <Form.Item
              label=""
              name="username"
              rules={[
                { required: true, message: "请输入用户名" },
                { max: 15, message: "用户名最多15位" },
                {
                  pattern: /^[^\u4e00-\u9fa5]+$/,
                  message: "用户名不能包含汉字",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item
              label=""
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密 码"
                className={styles.input}
              />
            </Form.Item>
            <Form.Item
              label=""
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "请输入确认密码" },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }

                    return Promise.reject("两次密码不一致");
                  },
                  message: "两次密码不一致",
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="确认密码"
                className={styles.input}
              />
            </Form.Item>

            <Form.Item label="">
              <span className={styles.info}>
                <span>已有账号？</span>
                <span className={styles.opt} onClick={() => changType("login")}>
                  去登录
                </span>
              </span>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className={styles.btn}>
                注 册
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
    </div>
  );
};

IndexPage.propTypes = {};

export default connect(({ jim }) => ({
  JIM: jim.JIM,
}))(IndexPage);
