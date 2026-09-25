import React, { useState, useCallback } from 'react';
import { Box, Container, Grid, Typography, Link, InputBase, IconButton, Button, FormHelperText } from '@mui/material';
import { Facebook, Instagram, Pinterest, YouTube, MailOutline as MailIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { SHOP_CATEGORIES, NEW_IN_URL, HANDCRAFTED_URL, productsUrl } from '../../../constants/navigation';
import { useToast } from '../../../contexts/ToastContext';
import { EMAIL_MAX_LENGTH, getEmailError } from '../../../utils/validation';
import styles from './Footer.module.css';

const SHOP_LINKS = [
  { label: 'New In', to: NEW_IN_URL },
  ...SHOP_CATEGORIES.map(({ label, category }) => ({ label, to: productsUrl({ category }) })),
  { label: 'Handcrafted', to: HANDCRAFTED_URL },
  { label: 'All Products', to: ROUTES.PRODUCTS },
];

const CARE_LINKS = [
  { label: 'Contact Us', to: '/contact' },
  { label: 'Shipping & Returns', to: '/shipping' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Track Your Order', to: ROUTES.ORDERS },
];

const ABOUT_LINKS = [
  { label: 'Our Story', to: '/about' },
  { label: 'Style Advisor', to: ROUTES.STYLE_ADVISOR },
  { label: 'Privacy Policy', to: '/privacy' },
];

const SOCIAL = [
  { label: 'Instagram', icon: <Instagram fontSize="small" /> },
  { label: 'Facebook', icon: <Facebook fontSize="small" /> },
  { label: 'Pinterest', icon: <Pinterest fontSize="small" /> },
  { label: 'YouTube', icon: <YouTube fontSize="small" /> },
];

const LinkColumn = ({ title, links }: { title: string; links: { label: string; to: string }[] }) => (
  <>
    <Typography component="h3" className={styles.sectionTitle}>{title}</Typography>
    <Box component="ul" className={styles.linkGroup}>
      {links.map(({ label, to }) => (
        <li key={label}>
          <Link component={RouterLink} to={to} className={styles.footerLink}>{label}</Link>
        </li>
      ))}
    </Box>
  </>
);

const Footer: React.FC = () => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // No newsletter backend yet: validate the address and acknowledge it.
  const handleSubscribe = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const error = getEmailError(email);
    setEmailError(error);
    if (error) return;
    setEmail('');
    showToast('Thank you — newsletter sign-ups open soon.', 'success');
  }, [email, showToast]);

  return (
    <Box component="footer" className={styles.footer}>
      <Box className={styles.newsletterBand}>
        <Container maxWidth="lg" className={styles.newsletterInner}>
          <Box className={styles.newsletterIntro}>
            <MailIcon className={styles.newsletterIcon} />
            <Box>
              <Typography component="h2" className={styles.newsletterTitle}>Be the first to know</Typography>
              <Typography className={styles.newsletterText}>New arrivals, private sales and style notes — straight to your inbox.</Typography>
            </Box>
          </Box>
          <Box>
            <Box component="form" onSubmit={handleSubscribe} noValidate className={styles.newsletterForm}>
              <InputBase
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                inputProps={{ 'aria-label': 'Email address', maxLength: EMAIL_MAX_LENGTH, inputMode: 'email', autoComplete: 'email' }}
                className={`${styles.emailInput} ${emailError ? styles.emailInputError : ''}`}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'newsletter-error' : undefined}
              />
              <Button type="submit" className={styles.subscribeButton}>Subscribe</Button>
            </Box>
            {emailError && <FormHelperText id="newsletter-error" error className={styles.emailError}>{emailError}</FormHelperText>}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 5, md: 4 }} className={styles.footerTop}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box className={styles.brand}>
              <span className={styles.brandName}>LUX ATELIER</span>
              <span className={styles.brandSub}>MEN&apos;S BOUTIQUE</span>
            </Box>
            <Typography variant="body2" className={styles.aboutText}>
              Tailored essentials for the modern gentleman — fine shirts, trousers and leather shoes, made to last.
            </Typography>
            <Box className={styles.socialIcons}>
              {SOCIAL.map(({ label, icon }) => (
                <IconButton key={label} aria-label={label} className={styles.socialButton}>{icon}</IconButton>
              ))}
            </Box>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 8 / 3 }}><LinkColumn title="Shop" links={SHOP_LINKS} /></Grid>
          <Grid size={{ xs: 6, sm: 4, md: 8 / 3 }}><LinkColumn title="Customer Care" links={CARE_LINKS} /></Grid>
          <Grid size={{ xs: 12, sm: 4, md: 8 / 3 }}><LinkColumn title="About Us" links={ABOUT_LINKS} /></Grid>
        </Grid>

        <Box className={styles.footerBottom}>
          <Typography variant="body2" className={styles.copyright}>
            &copy; {new Date().getFullYear()} Lux Atelier. All rights reserved.
          </Typography>
          <Box className={styles.legalLinks}>
            <Link component={RouterLink} to="/privacy" className={styles.footerLink}>Privacy Policy</Link>
            <span aria-hidden="true">|</span>
            <Link component={RouterLink} to="/terms" className={styles.footerLink}>Terms &amp; Conditions</Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
