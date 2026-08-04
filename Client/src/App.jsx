import MainLayout from "./layouts/MainLayout";
import { I18nProvider } from "./i18n/i18n";

function App() {
  return (
    <I18nProvider>
      <MainLayout />
    </I18nProvider>
  );
}

export default App;