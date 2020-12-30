import React from "react";
import { Router, Route, Switch, Redirect } from "dva/router";
import IndexPage from "./routes/IndexPage/index";
import HomePage from "./routes/HomePage/index";

function RouterConfig({ history }) {
  return (
    <Router history={history}>
      <Switch>
        <Route path="/login" exact component={IndexPage} />
        <Route path="/home" exact component={HomePage} />
        <Redirect from="/" to="/login" />
      </Switch>
    </Router>
  );
}

export default RouterConfig;
