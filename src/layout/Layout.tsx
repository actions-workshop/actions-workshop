import { AppHeader } from "./AppHeader";
import React, {
  FunctionComponent,
  PropsWithChildren,
  ReactElement,
} from "react";
import { PageLayout } from "@primer/react";

const Layout: FunctionComponent<PropsWithChildren> = ({
  children,
}): ReactElement => {
  return (
    <PageLayout rowGap="none">
      <PageLayout.Header
        sx={{
          backgroundColor: "white",
        }}
      >
        <AppHeader />
      </PageLayout.Header>
      <PageLayout.Content
        sx={{
          backgroundColor: "white",
        }}
      >
        {children}
      </PageLayout.Content>
    </PageLayout>
  );
};

export { Layout };
