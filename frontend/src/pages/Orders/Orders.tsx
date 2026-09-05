import React, { memo } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  Paper,
  Button,
  Breadcrumbs,
  Link,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as DeliveredIcon,
  Cancel as CancelledIcon,
  Pending as PendingIcon,
  Reorder as ReorderIcon,
  Star as StarIcon,
  ShoppingBag as ShoppingBagIcon,
} from '@mui/icons-material';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { useOrders } from '../../hooks/useOrders';
import styles from './Orders.module.css';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered':
      return <DeliveredIcon color="success" />;
    case 'shipped':
      return <ShippingIcon color="info" />;
    case 'cancelled':
      return <CancelledIcon color="error" />;
    default:
      return <PendingIcon color="warning" />;
  }
};

const Orders: React.FC = memo(() => {
  const {
    user,
    orders,
    loading,
    navigate,
    handleDownloadInvoice,
    getStatusColor,
  } = useOrders();

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box className={styles.authContainer}>
          <Typography variant="h4" gutterBottom>
            Please log in to view your orders
          </Typography>
          <Button variant="contained" href="/login">
            Sign In
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box className={styles.loadingContainer}>
          <LoadingSkeleton variant="list" count={5} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box className={styles.container}>
        {/* Breadcrumbs */}
        <Breadcrumbs className={styles.breadcrumbs}>
          <Link component="button" variant="body1" onClick={() => navigate('/')}>
            Home
          </Link>
          <Link component="button" variant="body1" onClick={() => navigate('/profile')}>
            Profile
          </Link>
          <Typography variant="body1" color="text.primary">
            Orders
          </Typography>
        </Breadcrumbs>

        <Typography variant="h3" component="h1" gutterBottom>
          My Orders
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </Typography>

        {orders.length === 0 ? (
          <Paper elevation={0} className={styles.emptyStatePaper}>
            <Avatar className={styles.emptyStateAvatar}>
              <ShoppingBagIcon className={styles.emptyStateIcon} />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              You haven't placed any orders yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph className={styles.emptyStateText}>
              Start shopping to see your order history here
            </Typography>
            <Button
              variant="contained"
              size="large"
              href="/products"
              className={styles.emptyStateButton}
            >
              Start Shopping
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {orders.map((order) => (
              <Grid size={{ xs: 12, }} key={order.id}>
                <Card elevation={0} className={styles.orderCard}>
                  <CardContent className={styles.cardContent}>
                    {/* Order Header */}
                    <Box className={styles.orderHeader}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Order #{order.id.slice(-8)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Typography>
                      </Box>
                      
                      <Box className={styles.orderHeaderActions}>
                        <Chip
                          icon={order.paymentStatus === 'paid' ? undefined : getStatusIcon(order.status)}
                          label={order.paymentStatus && order.paymentStatus !== 'pending'
                            ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
                            : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          color={order.paymentStatus === 'paid'
                            ? 'success'
                            : order.paymentStatus === 'failed'
                              ? 'error'
                              : order.paymentStatus === 'refunded'
                                ? 'warning'
                                : getStatusColor(order.status)}
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    {/* Order Items Accordion */}
                    <Accordion className={styles.accordion}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box className={styles.accordionSummaryBox}>
                          <Typography variant="subtitle1">
                            {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ₹{typeof order.totalAmount === 'string' ? parseFloat(order.totalAmount).toFixed(2) : order.totalAmount.toFixed(2)}
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {order.items.map((item, index) => (
                            <Box key={item.id}>
                              <ListItem className={styles.listItem}>
                                <ListItemIcon className={styles.listItemIcon}>
                                  <CardMedia
                                    component="img"
                                    className={styles.itemImage}
                                    image={item.product.imageUrl}
                                    alt={item.product.name}
                                  />
                                </ListItemIcon>
                                <ListItemText
                                  primary={item.product.name}
                                  secondary={`Size: ${item.size || 'One Size'} | Quantity: ${item.quantity} x ₹${typeof item.price === 'string' ? parseFloat(item.price).toFixed(2) : item.price.toFixed(2)}`}
                                  primaryTypographyProps={{ variant: 'subtitle2' }}
                                  secondaryTypographyProps={{ variant: 'body2' }}
                                />
                                <Typography variant="subtitle1" className={styles.itemPrice}>
                                  ₹{((typeof item.price === 'string' ? parseFloat(item.price) : item.price) * item.quantity).toFixed(2)}
                                </Typography>
                              </ListItem>
                              {index < order.items.length - 1 && <Divider />}
                            </Box>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    {/* Order Actions */}
                    <Box className={styles.orderActionsBox}>
                      <Box className={styles.orderActionsButtons}>
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          variant="outlined"
                          onClick={() => handleDownloadInvoice(order)}
                        >
                          Invoice
                        </Button>
                        {order.status === 'delivered' && (
                          <Button
                            size="small"
                            startIcon={<StarIcon />}
                            variant="outlined"
                          >
                            Review
                          </Button>
                        )}
                        {order.status === 'delivered' && (
                          <Button
                            size="small"
                            startIcon={<ReorderIcon />}
                            variant="contained"
                          >
                            Reorder
                          </Button>
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        Est. Delivery: {new Date(
                          new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
});

export default Orders;