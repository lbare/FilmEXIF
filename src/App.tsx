import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import TabNavigator from "./navigation/TabNavigator";
import "@mantine/core/styles.css";

const App: React.FC = () => {
  useEffect(() => console.log("App mounted"), []);

  return (
    <MantineProvider>
      <Router basename="/FilmEXIF">
        <Routes>
          <Route path="/" element={<Navigate to="/tabs/home" replace />} />
          <Route path="/tabs/:tabValue" element={<TabNavigator />} />
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
