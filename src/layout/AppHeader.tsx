import { Button, Header, StyledOcticon } from "@primer/react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { FunctionComponent, ReactElement } from "react";
import { MarkGithubIcon } from "@primer/octicons-react";
import { useUser } from "../auth/UserContextProvider";

// We can't combine react-routers 'Link' with the
// Primer 'Link' - so we have to copy the styles
const GHStyledLink = styled(Link)`
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  cursor: pointer;
  -webkit-text-decoration: none;
  text-decoration: none;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-align-items: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;

  &:hover {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const AppHeader: FunctionComponent = (): ReactElement => {
  const { isLoggedIn, logout } = useUser();

  return (
    <Header>
      <Header.Item full>
        <StyledOcticon icon={MarkGithubIcon} size={32} sx={{ mr: 2 }} />
        <GHStyledLink to="/">RocketDex</GHStyledLink>
      </Header.Item>
      <Header.Item>
        {isLoggedIn ? (
          <Button onClick={() => logout()}>Sign out</Button>
        ) : (
          <GHStyledLink to="/login">Sign in</GHStyledLink>
        )}
      </Header.Item>
    </Header>
  );
};

export { AppHeader };
