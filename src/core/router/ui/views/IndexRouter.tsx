import { Route, Switch } from "wouter";
import { ROUTER_CONFIG } from "../../ui/config/router.config";
import { AnimatePresence } from "framer-motion";

const routes = ROUTER_CONFIG.routes;

function IndexRouter() {
  return (
    <AnimatePresence mode="wait">
      <Switch>
        {routes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            component={route.component}
          />
        ))}
      </Switch>
    </AnimatePresence>
  );
}

export default IndexRouter;
