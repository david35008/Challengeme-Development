import React, { useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Link, useHistory, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Tooltip from '@material-ui/core/Tooltip';
import Avatar from '@material-ui/core/Avatar';
import HomeIcon from '@material-ui/icons/Home';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Drawer from '@material-ui/core/Drawer';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Button from '@material-ui/core/Button';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import GroupIcon from '@material-ui/icons/Group';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import LockIcon from '@material-ui/icons/Lock';
import AddIcon from '@material-ui/icons/Add';
import ChooseLabels from '../../Choosers/ChooseLabels';
import FilteredLabels from '../../../context/FilteredLabelsContext';
import useStyles from './NarrowNavStyled';
import { Logged } from '../../../context/LoggedInContext';
import Search from '../Search';
import network from '../../../services/network';

export default function NarrowNav() {
  const classes = useStyles();
  const filteredLabels = useContext(FilteredLabels);
  const [labels, setLabels] = useState([]);
  const [chooseLabels, setChooseLabels] = useState([]);
  const location = useHistory();
  const LoggedContext = useContext(Logged);
  const [openNavBar, setOpenNavBar] = useState(false);
  const currentLocation = useLocation();

  useEffect(() => {
    if (currentLocation.pathname !== '/') {
      setLabels([]);
    } else {
      const newFilter = chooseLabels.filter(
        (label) => label.value === (filteredLabels ? filteredLabels.filteredLabels[0] : null),
      );
      setLabels(newFilter);
    }
    // eslint-disable-next-line
  }, [currentLocation]);

  const handleDrawerOpen = () => {
    setOpenNavBar(true);
  };

  const handleDrawerClose = () => {
    setOpenNavBar(false);
  };

  const logOut = async () => {
    try {
      await network.post('/api/v1/auth/logout', {
        token: Cookies.get('refreshToken'),
      });
      Cookies.remove('refreshToken');
      Cookies.remove('accessToken');

      Cookies.remove('userId');
      Cookies.remove('userName');
      LoggedContext.setLogged(false);
      LoggedContext.setIsAdmin(false);
      location.push('/login');
    } catch (error) {
    }
  };
  const headerStyle = {
    backgroundColor: 'transfer',
  };
  const letterColor = {
    color: 'black',
  };
  const dividerColor = {};
  return (
    <>
      <AppBar position="fixed" className={clsx(classes.appBar, {})} style={headerStyle}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            className={clsx(classes.menuButton)}
          >
            <MenuIcon style={letterColor} />
          </IconButton>
          <Search />
          <div
            style={{
              minWidth: '150px',
              width: 'fit-content',
              marginLeft: '10px',
            }}
          >
            {currentLocation.pathname === '/' ? (
              <ChooseLabels
                labels={labels}
                chooseLabels={chooseLabels}
                setChooseLabels={setChooseLabels}
                setLabels={setLabels}
              />
            ) : null}
          </div>
          {currentLocation.pathname === '/' ? (
            <Button
              onClick={() => {
                filteredLabels.setFilteredLabels(labels ? labels.map((label) => label.value) : []);
              }}
              variant="contained"
              className={classes.filterButton}
            >
              filter
            </Button>
          ) : null}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        anchor="left"
        open={openNavBar}
        classes={{ paper: classes.drawerPaper }}
      >
        <div className={classes.generalDrawerHeader}>
          <div className={classes.avatarUserInfo}>
            {LoggedContext.logged && Cookies.get('userName')
              ? (
                <Tooltip title={Cookies.get('userName')}>
                  <Avatar
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    color="inherit"
                    style={{
                      cursor: 'pointer',
                      backgroundColor: '#7BACB4',
                    }}
                  >
                    {Cookies.get('userName').slice(0, 2)}
                  </Avatar>
                </Tooltip>
              ) : null}
            <div className={classes.heyName} style={letterColor}>
              <b>
                {Cookies.get('userName') ? (`Hey ${Cookies.get('userName')}`) : 'Welcome to ChallengeMe'}
              </b>
            </div>
          </div>
          <div className={classes.drawerHeader}>
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon style={letterColor} />
            </IconButton>
          </div>
        </div>
        <Divider style={dividerColor} />
        <List className={classes.list}>
          <Link to="/" className="link-rout">
            <ListItem button onClick={handleDrawerClose} style={letterColor}>
              <ListItemIcon>
                <HomeIcon style={letterColor} />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
          </Link>
          <Divider style={dividerColor} />
          <Link to="/profile/info" className="link-rout">
            <ListItem button onClick={handleDrawerClose} style={letterColor}>
              <ListItemIcon>
                <AccountCircleIcon style={letterColor} />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
          </Link>
          <Divider style={dividerColor} />
          <Link to="/teams" className="link-rout">
            <ListItem button onClick={handleDrawerClose} style={letterColor}>
              <ListItemIcon>
                <GroupIcon style={letterColor} />
              </ListItemIcon>
              <ListItemText primary="Teams Area" />
            </ListItem>
          </Link>
          {LoggedContext.isAdmin && (
            <>
              <Divider style={dividerColor} />
              <Link to="/admin/DashBoard" className="link-rout">
                <ListItem button onClick={handleDrawerClose} style={letterColor}>
                  <ListItemIcon>
                    <LockIcon style={letterColor} />
                  </ListItemIcon>
                  <ListItemText primary="Admin Area" />
                </ListItem>
              </Link>
            </>
          )}
          <Divider style={dividerColor} />
          <Link to="/addnewchallenge" className="link-rout">
            <ListItem button onClick={handleDrawerClose} style={letterColor}>
              <ListItemIcon>
                <AddIcon style={letterColor} />
              </ListItemIcon>
              <ListItemText primary="Add New Challenge" />
            </ListItem>
          </Link>
          <Divider style={dividerColor} />
          <ListItem className={classes.logOut} onClick={handleDrawerClose}>
            <IconButton
              aria-label="delete"
            >
              <Brightness4Icon style={letterColor} />
            </IconButton>
          </ListItem>
          <Divider style={dividerColor} />
          {LoggedContext.logged
            ? (
              <ListItem className={classes.logOut} onClick={handleDrawerClose}>
                <Button
                  className={classes.logOutButton}
                  onClick={logOut}
                  style={{ minWidth: 150 }}
                  variant="contained"
                  color="secondary"
                >
                  Log Out
                </Button>
              </ListItem>
            ) : (
              <>
                <Link to="/login" className="link-rout">
                  <Button variant="contained" className={classes.filterButton}>
                    Login
                  </Button>
                </Link>
                <Link to="/register" className="link-rout">
                  <Button variant="contained" className={classes.filterButton}>
                    Register
                  </Button>
                </Link>
              </>
            )}
          <Divider style={dividerColor} />
        </List>
      </Drawer>
    </>
  );
}
