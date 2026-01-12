# Wedding Marketplace App - Design Guidelines

## 1. Brand Identity

**Purpose**: Connect Scandinavian wedding couples with premium vendors (photographers, videographers, DJs) through a curated marketplace that feels personal, trustworthy, and effortless.

**Aesthetic Direction**: **Editorial/Sophisticated** — Think Vogue meets Airbnb. Clean typographic hierarchy, generous whitespace, high-quality imagery takes center stage. The app should feel like flipping through a luxury magazine, not browsing a directory. 

**Memorable Element**: Portfolio imagery floods the screen edge-to-edge. Vendor work is the hero — the UI fades into the background, letting the photography and videography speak for itself.

## 2. Navigation Architecture

**Auth Required**: Yes (SSO preferred)
- Apple Sign-In (iOS required)
- Google Sign-In
- Account types: Couple or Vendor (selected during onboarding)

**Root Navigation**: Tab Bar (4 tabs for Couples, Drawer for Vendors)

**Couples App Screens**:
- **Discover** (Tab 1): Browse vendors by category, location, availability
- **Saved** (Tab 2): Bookmarked vendors and shortlists
- **Messages** (Tab 3): Chat with vendors, manage inquiries
- **Profile** (Tab 4): Couple's wedding details, booked vendors, settings

**Vendors App Screens**:
- **Dashboard**: Upcoming bookings, pending inquiries, earnings
- **Portfolio**: Manage work samples, testimonials
- **Calendar**: Availability management
- **Messages**: Client communications
- **Settings**: Profile, pricing, notifications

## 3. Screen Specifications

### Discover (Couples - Tab 1)
- **Header**: Transparent, search bar, filter icon (right)
- **Layout**: Scrollable feed of vendor cards
- **Components**: Category chips (horizontal scroll), large vendor cards (image + name + rating + starting price)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl
- **Empty State**: "No vendors match your criteria" with illustration

### Vendor Detail
- **Header**: Transparent with back button, share icon (right)
- **Layout**: Scrollable
- **Components**: Hero image carousel, vendor bio, portfolio grid, reviews, pricing, "Send Inquiry" button (fixed at bottom)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: insets.bottom + Spacing.xl (floating button)

### Messages (Both - Tab 3)
- **Header**: Default, "Messages" title, compose icon (right)
- **Layout**: List view
- **Components**: Conversation previews with avatar, name, last message, unread badge
- **Safe Area**: Top: Spacing.xl, Bottom: tabBarHeight + Spacing.xl
- **Empty State**: "No conversations yet" illustration

### Profile Setup (Onboarding)
- **Header**: None
- **Layout**: Scrollable form
- **Components**: Wedding date picker, location, budget range, vendor categories needed
- **Buttons**: Submit/Cancel in header
- **Safe Area**: Top: insets.top + Spacing.xl, Bottom: insets.bottom + Spacing.xl

## 4. Color Palette

**Primary**: #1A1A1A (Rich Black) — Used for headers, primary text, buttons
**Accent**: #D4AF37 (Antique Gold) — Used sparingly for CTAs, highlights, active states
**Background**: #FAFAFA (Warm White)
**Surface**: #FFFFFF (Pure White) — Cards, modals
**Text Primary**: #1A1A1A
**Text Secondary**: #6B6B6B
**Border**: #E8E8E8
**Success**: #2D7A4F
**Error**: #C13838

## 5. Typography

**Primary Font**: **Cormorant Garamond** (Google Font, serif) — Headings, vendor names
**Secondary Font**: **Inter** (Google Font, sans-serif) — Body text, UI elements

**Type Scale**:
- H1: Cormorant 32pt Bold
- H2: Cormorant 24pt SemiBold
- Body: Inter 16pt Regular
- Caption: Inter 14pt Regular
- Button: Inter 16pt Medium

## 6. Visual Design
- Vendor cards use 16:9 aspect ratio images
- All touchable elements have subtle opacity feedback (0.7 on press)
- Floating "Send Inquiry" button uses shadow: offset (0,2), opacity 0.10, radius 2
- Tab bar icons from Feather set
- Cards have 1px border (#E8E8E8), no shadow

## 7. Assets to Generate

**Required**:
- **icon.png**: Interlocking rings with minimalist gold accent — app icon
- **splash-icon.png**: Same as icon — splash screen
- **empty-discover.png**: Elegant illustration of empty gallery frames — Discover tab when no results
- **empty-saved.png**: Simple bookmark with heart illustration — Saved tab when empty
- **empty-messages.png**: Envelope with gentle flourish — Messages tab when empty
- **onboarding-welcome.png**: Couple silhouette with Scandinavian landscape — welcome screen

**Recommended**:
- **avatar-couple-1.png**, **avatar-couple-2.png**: Preset couple avatars — profile setup
- **avatar-vendor-1.png**, **avatar-vendor-2.png**: Preset vendor avatars — profile setup
- **category-photo.png**, **category-video.png**, **category-dj.png**: Category icons — Discover filters

All illustrations should be minimal line art with subtle gold accents, matching the editorial aesthetic.