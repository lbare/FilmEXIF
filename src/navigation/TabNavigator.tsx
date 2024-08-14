import { useNavigate, useParams } from "react-router-dom";
import { Tabs } from "@mantine/core";
import { House, Plus, CameraPlus, Gear } from "@phosphor-icons/react";
import Home from "../pages/Home";
import AddRoll from "../pages/AddRoll";
import Library from "../pages/Library";
import Settings from "../pages/Settings";

const TabNavigator = () => {
  const navigate = useNavigate();
  const { tabValue } = useParams();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Tabs
        value={tabValue || "home"}
        onChange={(value) => navigate(`/tabs/${value}`)}
        style={{ flex: 1 }}
      >
        <Tabs.Panel value="home">
          <Home />
        </Tabs.Panel>
        <Tabs.Panel value="add">
          <AddRoll />
        </Tabs.Panel>
        <Tabs.Panel value="library">
          <Library />
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <Settings />
        </Tabs.Panel>

        <Tabs.List
          style={{ position: "sticky", bottom: 0, backgroundColor: "white" }}
          justify="space-between"
        >
          <Tabs.Tab
            leftSection={<House size={32} weight="regular" color="#000000" />}
            value="home"
          />
          <Tabs.Tab
            leftSection={<Plus size={32} weight="regular" color="#000000" />}
            value="add"
          />
          <Tabs.Tab
            leftSection={
              <CameraPlus size={32} weight="regular" color="#000000" />
            }
            value="library"
          />
          <Tabs.Tab
            leftSection={<Gear size={32} weight="regular" color="#000000" />}
            value="settings"
          />
        </Tabs.List>
      </Tabs>
    </div>
  );
};

export default TabNavigator;
