import { Box, IconButton, Label, Text } from "@primer/react";
import { OctocatState } from "../api/types/OctocatState";
import { FunctionComponent, ReactElement } from "react";
import styled from "styled-components";
import { StarIcon, XCircleIcon } from "@primer/octicons-react";

interface OctoItemBoxProps {
  octocat: OctocatState;
  onToggleOctocat: (octocat: OctocatState) => void;
}

const OctoImage = styled.img`
  max-width: 100%;
`;

const OctoItemBox: FunctionComponent<OctoItemBoxProps> = ({
  octocat,
  onToggleOctocat,
}): ReactElement => {
  const toggleButton = octocat.owned ? (
    <IconButton
      aria-label={`Remove ${octocat.name} from your collection`}
      size="large"
      sx={{ ml: 2 }}
      variant="danger"
      icon={XCircleIcon}
      onClick={() => onToggleOctocat(octocat)}
    />
  ) : (
    <IconButton
      aria-label={`Add ${octocat.name} to your collection`}
      size="large"
      sx={{ ml: 2 }}
      variant="outline"
      icon={StarIcon}
      onClick={() => onToggleOctocat(octocat)}
    />
  );

  return (
    <Box width={[1, 1 / 2, 1 / 3, 1 / 4]} p={[2, 4, 16]}>
      <Box
        p={2}
        borderColor="border.default"
        position="relative"
        borderWidth={1}
        borderStyle="solid"
        height={"100%"}
      >
        {octocat.owned && (
          <Box display="inline" position="absolute">
            <Label size="large" variant="success">
              Owned
            </Label>
          </Box>
        )}
        <OctoImage src={octocat.imageUrl}></OctoImage>
        <Box display="flex" justifyContent="space-between">
          <Text as="p" m={2} fontWeight="bold">
            {octocat.name}
          </Text>
          {toggleButton}
        </Box>
      </Box>
    </Box>
  );
};

export { OctoItemBox };
