import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { RollsProvider } from "./contexts/RollsContext";
import TabNavigator from "./navigation/TabNavigator";
import "@mantine/core/styles.css";

const App: React.FC = () => {
  useEffect(() => console.log("App mounted"), []);

  return (
    <MantineProvider defaultColorScheme="dark">
      <RollsProvider>
        <Router basename="/FilmEXIF">
          <Routes>
            <Route path="/" element={<Navigate to="/tabs/library" replace />} />
            <Route path="/tabs/:tabValue" element={<TabNavigator />} />
            <Route path="*" element={<Navigate to="/tabs/library" replace />} />
          </Routes>
        </Router>
      </RollsProvider>
    </MantineProvider>
  );
};

export default App;
