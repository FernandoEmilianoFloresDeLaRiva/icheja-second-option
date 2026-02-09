import { Redirect } from "wouter";
import ExerciseViews from "../../../../exercises/views/ExerciseViews";
import { NavigationItem } from "../../domain/entities";
import { RouterItem } from "../../domain/entities/RouterItem.entity";
import settingsIcon from "../../../../assets/images/settings.png";
import bagIcon from "../../../../assets/images/bag-icon.png";
import exerciseIcon from "../../../../assets/images/exercise.png";
import homeIcon from "../../../../assets/images/home.png";
import UnitsView from "../../../../units/views/UnitsView";
import AppLayout from "../../../../common/layouts/AppLayout/AppLayout";
import ResultsView from "../../../../results/views/ResultsView";
import SettingsPage from "../../../../settings/pages/WelcomePage";
import WelcomePage from "../../../../welcome/pages/WelcomePage";
import SplashView from "../../../../splash/views/SplashView";

export const ROUTER_CONFIG = {
  routes: [
    new RouterItem("/", () => <SplashView />),
    new RouterItem("/exercises", () => (
      <AppLayout>
        <ExerciseViews />
      </AppLayout>
    )),
    new NavigationItem(
      "welcome",
      "Inicio",
      false, // Cambiar a false, se sincronizará con la ruta actual
      homeIcon,
      "/welcome",
      WelcomePage
    ),
    new NavigationItem(
      "units",
      "Ejercicios",
      false,
      exerciseIcon,
      "/units",
      UnitsView
    ),
    new NavigationItem(
      "results",
      "Resultados",
      false,
      bagIcon,
      "/results",
      () => (
        <AppLayout>
          <ResultsView />
        </AppLayout>
      )
    ),
    new NavigationItem(
      "settings",
      "Configuración",
      false,
      settingsIcon,
      "/settings",
      () => <SettingsPage />
    ),
    new RouterItem("/exercise/:unitId", () => (
      <AppLayout>
        <ExerciseViews />
      </AppLayout>
    )),
    new RouterItem("*", () => <Redirect to="/" />),
  ],
};
