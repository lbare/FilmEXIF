import { useNavigate, useParams } from "react-router-dom";
import { Tabs } from "@mantine/core";
import { Images, CameraPlus, Gear } from "@phosphor-icons/react";
import AddRoll from "../pages/AddRoll";
import Library from "../pages/Library";
import Settings from "../pages/Settings";

const TabNavigator = () => {
  const navigate = useNavigate();
  const { tabValue } = useParams();

  return (
    <div className="flex flex-col min-h-screen bg-neutral-900">
      <Tabs
        value={tabValue || "home"}
        onChange={(value) => navigate(`/tabs/${value}`)}
        className="flex flex-1 flex-col"
        variant="pills"
        radius="xl"
        color="green"
      >
        <div style={{ flex: 1, overflowY: "auto" }}>
          <Tabs.Panel value="library">
            <Library />
          </Tabs.Panel>
          <Tabs.Panel value="add">
            <AddRoll />
          </Tabs.Panel>
          <Tabs.Panel value="settings">
            <Settings />
          </Tabs.Panel>
        </div>

        <Tabs.List
          style={{ position: "sticky" }}
          className="bottom-0 bg-neutral-900 pb-4"
          justify="space-evenly"
        >
          <Tabs.Tab
            leftSection={<Images size={32} weight="regular" color="#FFFFFF" />}
            value="library"
          />
          <Tabs.Tab
            leftSection={
              <CameraPlus size={32} weight="regular" color="#FFFFFF" />
            }
            value="add"
          />
          <Tabs.Tab
            leftSection={<Gear size={32} weight="regular" color="#FFFFFF" />}
            value="settings"
          />
        </Tabs.List>
      </Tabs>
    </div>
  );
};

export default TabNavigator;
