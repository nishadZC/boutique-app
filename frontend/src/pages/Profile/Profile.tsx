import React, { memo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  ShoppingBag as OrdersIcon,
  Favorite as WishlistIcon,
  ExitToApp as LogoutIcon,
  CalendarToday as CalendarIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { AddressForm } from '../../components/AddressForm/AddressForm';
import { useProfile } from '../../hooks/useProfile';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { ROUTES } from '../../constants/routes';
import styles from './Profile.module.css';

const Profile: React.FC = memo(() => {
  const { openLoginModal } = useAuthModal();
  const {
    user,
    editOpen,
    setEditOpen,
    editData,
    setEditData,
    editAddress,
    setEditAddress,
    updating,
    handleLogout,
    handleSaveProfile,
  } = useProfile();

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box className={styles.unauthenticatedContainer}>
          <Typography variant="h4" gutterBottom>
            Please log in to view your profile
          </Typography>
          <Button variant="contained" onClick={() => openLoginModal()}>
            Sign In
          </Button>
        </Box>
      </Container>
    );
  }

  const menuItems = [
    { icon: <OrdersIcon />, label: 'Order History', path: ROUTES.ORDERS },
    { icon: <WishlistIcon />, label: 'Wishlist', path: ROUTES.WISHLIST },
  ];

  const memberSince = new Date(user.createdAt || Date.now()).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <Container maxWidth="lg">
      <Box className={styles.container}>
        <Typography variant="h3" component="h1" gutterBottom className={styles.pageTitle}>
          My Profile
        </Typography>
        
        <Grid container spacing={4}>
          {/* Profile Header */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={3} className={styles.headerPaper}>
              <Avatar className={styles.avatar}>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user.firstName} {user.lastName}
              </Typography>
              <Chip
                label={user.role}
                color="primary"
                size="small"
                className={styles.roleChip}
              />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user.email}
              </Typography>
              <Box className={styles.memberSince}>
                <CalendarIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Member since {memberSince}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                fullWidth
                className={styles.editButton}
                onClick={() => setEditOpen(true)}
              >
                Edit Profile
              </Button>
              <Button
                variant="text"
                color="error"
                startIcon={<LogoutIcon />}
                fullWidth
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Paper>
          </Grid>
          
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={2} className={styles.contentPaper}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Full Name"
                        secondary={`${user.firstName} ${user.lastName}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email Address"
                        secondary={user.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Phone Number"
                        secondary={user.phone || "Not provided"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Address"
                        secondary={user.address || "Not provided"}
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Grid>
              
              {/* Quick Actions */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={2} className={styles.contentPaper}>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <List>
                    {menuItems.map((item) => (
                      <ListItem
                        key={item.path}
                        component={RouterLink}
                        to={item.path}
                        className={styles.quickActionItem}
                      >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                        <ChevronRightIcon color="disabled" fontSize="small" />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box className={styles.dialogContentBox}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={editData.firstName}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              label="Phone Number"
              fullWidth
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              sx={{ mb: 3 }}
            />
            <AddressForm value={editAddress} onChange={setEditAddress} />
          </Box>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveProfile}
            disabled={updating}
          >
            {updating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
});

export default Profile;