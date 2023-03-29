import { Box } from "@primer/react";
import { FunctionComponent, ReactElement } from "react";
import { OctocatState } from "../api/types/OctocatState";
import { OctoItemBox } from "./OctocatBox";

interface OctoCollectionProps {
  octoItems: OctocatState[];
  onToggleOctocat: (octocat: OctocatState) => void;
}

const OctoCollection: FunctionComponent<OctoCollectionProps> = ({
  octoItems,
  onToggleOctocat,
}): ReactElement => {
  const items = octoItems.map((item) => (
    <OctoItemBox
      key={item.id}
      octocat={item}
      onToggleOctocat={onToggleOctocat}
    />
  ));

  return (
    <Box display="flex" flex={"flex"} flexWrap={"wrap"}>
      {items}
    </Box>
  );
};

export { OctoCollection };
