import React from 'react';
import { Box, Container, Grid, Typography, Link, TextField, Button, IconButton } from '@mui/material';
import { Facebook, Instagram, Twitter, YouTube } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer: React.FC = () => {
  return (
    <Box component="footer" className={styles.footer}>
      <Container maxWidth="lg">
        <Grid container spacing={6} className={styles.footerTop}>
          
          {/* Brand & About */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h5" className={styles.brandName}>
              Lux Atelier
            </Typography>
            <Typography variant="body2" className={styles.aboutText}>
              Curating the finest luxury products for those with discerning taste. 
              Elevate your lifestyle with our exclusive collections of premium apparel and accessories.
            </Typography>
            <Box className={styles.socialIcons}>
              <IconButton color="inherit" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <Instagram />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="YouTube">
                <YouTube />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Typography variant="h6" className={styles.sectionTitle}>
              Quick Links
            </Typography>
            <Box className={styles.linkGroup}>
              <Link component={RouterLink} to="/" className={styles.footerLink}>Home</Link>
              <Link component={RouterLink} to="/products" className={styles.footerLink}>Shop All</Link>
              <Link component={RouterLink} to="/style-advisor" className={styles.footerLink}>Style Advisor</Link>
              <Link component={RouterLink} to="/about" className={styles.footerLink}>About Us</Link>
            </Box>
          </Grid>

          {/* Customer Service */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Typography variant="h6" className={styles.sectionTitle}>
              Customer Care
            </Typography>
            <Box className={styles.linkGroup}>
              <Link component={RouterLink} to="/contact" className={styles.footerLink}>Contact Us</Link>
              <Link component={RouterLink} to="/shipping" className={styles.footerLink}>Shipping & Returns</Link>
              <Link component={RouterLink} to="/faq" className={styles.footerLink}>FAQ</Link>
              <Link component={RouterLink} to="/privacy" className={styles.footerLink}>Privacy Policy</Link>
            </Box>
          </Grid>

          {/* Newsletter */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" className={styles.sectionTitle}>
              Stay Connected
            </Typography>
            <Typography variant="body2" className={styles.newsletterText}>
              Subscribe to receive updates, access to exclusive deals, and more.
            </Typography>
            <Box component="form" className={styles.newsletterForm} noValidate>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Enter your email"
                className={styles.emailInput}
                fullWidth
              />
              <Button 
                variant="contained" 
                disableElevation
                sx={{ 
                  flexShrink: 0,
                  bgcolor: '#d4af37', 
                  color: '#1a1a1a', 
                  fontWeight: 600, 
                  px: 3, 
                  textTransform: 'uppercase',
                  '&:hover': { bgcolor: '#b8941f' } 
                }}
              >
                Subscribe
              </Button>
            </Box>
          </Grid>

        </Grid>

        {/* Bottom bar */}
        <Box className={styles.footerBottom}>
          <Typography variant="body2" className={styles.copyright}>
            &copy; {new Date().getFullYear()} Lux Atelier. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
