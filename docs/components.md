# Component Library

## Overview

ResumeBoost component library follows Atomic Design principles with mobile-first responsive design.

## Design System

### Colors

#### Primary Colors
- **primary-50**: #3b82f6 - Light blue for hover states
- **primary-500**: #4f46e5 - Main primary color
- **primary-600**: #2563eb - Darker primary for pressed states
- **primary-900**: #111827 - Dark primary for text

#### Secondary Colors
- **secondary-50**: #e5e7eb - Light gray for backgrounds
- **secondary-100**: #f3f4f3 - Lighter gray for cards
- **secondary-500**: #c2410c - Accent color for CTAs
- **secondary-700**: #334155 - Dark gray for text

### Typography

#### Font Sizes
- **text-xs**: 0.75rem (12px) - Small labels
- **text-sm**: 0.875rem (14px) - Body text
- **text-base**: 1rem (16px) - Default text
- **text-lg**: 1.125rem (18px) - Large body
- **text-xl**: 1.25rem (20px) - Small headings
- **text-2xl**: 1.5rem (24px) - Main headings
- **text-3xl**: 1.875rem (30px) - Large headings

#### Font Weights
- **font-light**: 300
- **font-normal**: 400
- **font-medium**: 500
- **font-semibold**: 600
- **font-bold**: 700

### Spacing

#### Scale
- **p-1**: 0.25rem (4px)
- **p-2**: 0.5rem (8px)
- **p-3**: 0.75rem (12px)
- **p-4**: 1rem (16px)
- **p-6**: 1.5rem (24px)
- **p-8**: 2rem (32px)
- **p-12**: 3rem (48px)

### Breakpoints

- **sm**: 640px - Small tablets
- **md**: 768px - Tablets
- **lg**: 1024px - Desktops
- **xl**: 1280px - Large desktops
- **2xl**: 1536px - Extra large screens

## Atomic Components

### Atoms

#### Button
Basic button component with multiple variants.

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}
```

**Variants:**
- **Primary**: Main action buttons
- **Secondary**: Secondary actions
- **Outline**: Border-only buttons
- **Ghost**: Text-only buttons

**Sizes:**
- **sm**: Small buttons for tight spaces
- **md**: Default button size
- **lg**: Large buttons for emphasis

```typescript
// Usage examples
<Button variant="primary" size="md" onClick={handleSubmit}>
  Submit
</Button>

<Button variant="outline" size="sm" icon={<ArrowIcon />}>
  Back
</Button>
```

#### Input
Form input with validation states.

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'file';
  placeholder?: string;
  value?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (value: string) => void;
}
```

**States:**
- **Default**: Normal input state
- **Error**: Red border and error message
- **Disabled**: Grayed out and non-interactive
- **Focused**: Blue border and shadow

```typescript
// Usage examples
<Input
  type="email"
  placeholder="Enter your email"
  value={email}
  error={emailError}
  onChange={setEmail}
  required
/>
```

#### Badge
Small status indicators and labels.

```typescript
interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}
```

**Variants:**
- **Success**: Green for positive states
- **Warning**: Yellow for attention
- **Error**: Red for errors
- **Info**: Blue for information

```typescript
// Usage examples
<Badge variant="success">Completed</Badge>
<Badge variant="error" size="sm">Error</Badge>
```

#### Icon
Consistent icon component with sizing.

```typescript
interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}
```

**Sizes:**
- **sm**: 16px
- **md**: 24px
- **lg**: 32px

```typescript
// Usage examples
<Icon name="upload" size="md" color="primary-500" />
<Icon name="check" size="sm" color="secondary-500" />
```

### Molecules

#### Card
Container component for content grouping.

```typescript
interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
```

**Layout:**
- **Header**: Title and subtitle
- **Content**: Main content area
- **Footer**: Actions and metadata

```typescript
// Usage examples
<Card title="Analysis Results" subtitle="Resume vs Job Description">
  <AnalysisContent />
  <Card.Actions>
    <Button>Download Report</Button>
  </Card.Actions>
</Card>
```

#### FormField
Input with label and validation.

```typescript
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}
```

**Structure:**
- **Label**: Descriptive text
- **Input**: Form control
- **Error**: Validation message
- **Hint**: Helper text

```typescript
// Usage examples
<FormField label="Email Address" required error={emailError}>
  <Input
    type="email"
    value={email}
    onChange={setEmail}
  />
</FormField>
```

#### Modal
Overlay component for dialogs.

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

**Features:**
- **Overlay**: Semi-transparent background
- **Close button**: X button in corner
- **Escape key**: Close on ESC
- **Focus trap**: Keep focus within modal

```typescript
// Usage examples
<Modal isOpen={isModalOpen} onClose={closeModal} title="Confirm Action">
  <p>Are you sure you want to delete this item?</p>
  <Modal.Actions>
    <Button variant="outline" onClick={closeModal}>Cancel</Button>
    <Button variant="primary" onClick={confirmAction}>Delete</Button>
  </Modal.Actions>
</Modal>
```

### Organisms

#### Header
Main navigation header component.

```typescript
interface HeaderProps {
  user?: User;
  navigation?: NavigationItem[];
  actions?: React.ReactNode;
}
```

**Sections:**
- **Logo**: Brand identity
- **Navigation**: Main menu items
- **User**: Profile and actions
- **Mobile**: Mobile menu toggle

```typescript
// Usage examples
<Header
  user={currentUser}
  navigation={mainNavigation}
  actions={<NotificationBell />}
/>
```

#### Sidebar
Collapsible navigation sidebar.

```typescript
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items?: SidebarItem[];
  activeItem?: string;
}
```

**Features:**
- **Collapsible**: Can be hidden/shown
- **Active state**: Highlight current page
- **Responsive**: Adapts to screen size
- **Keyboard navigation**: Accessible

```typescript
// Usage examples
<Sidebar
  isOpen={sidebarOpen}
  onClose={closeSidebar}
  items={sidebarItems}
  activeItem={currentPath}
/>
```

#### DataTable
Data table with sorting and pagination.

```typescript
interface DataTableProps {
  columns: TableColumn[];
  data: any[];
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  onRowClick?: (row: any) => void;
}
```

**Features:**
- **Sorting**: Click headers to sort
- **Pagination**: Navigate large datasets
- **Responsive**: Adapts to mobile
- **Selection**: Row selection capability

```typescript
// Usage examples
<DataTable
  columns={tableColumns}
  data={tableData}
  pagination={paginationConfig}
  onRowClick={handleRowClick}
/>
```

### Templates

#### PageLayout
Standard page layout structure.

```typescript
interface PageLayoutProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}
```

**Structure:**
- **Header**: Page title and actions
- **Breadcrumbs**: Navigation path
- **Content**: Main page content
- **Sidebar**: Optional sidebar

```typescript
// Usage examples
<PageLayout
  title="Resume Analysis"
  subtitle="Upload your resume for AI analysis"
  actions={<Button>Start New Analysis</Button>}
>
  <AnalysisForm />
</PageLayout>
```

#### AuthLayout
Layout for authentication pages.

```typescript
interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}
```

**Features:**
- **Centered**: Centered content
- **Responsive**: Mobile-friendly
- **Branding**: Company logo and colors
- **Links**: Navigation to other auth pages

```typescript
// Usage examples
<AuthLayout
  title="Sign In"
  subtitle="Welcome back to ResumeBoost"
>
  <SignInForm />
</AuthLayout>
```

## Usage Guidelines

### Import Patterns

```typescript
// Import individual components
import { Button, Input, Card } from '@/components/atoms';

// Import component groups
import * as Atoms from '@/components/atoms';
import * as Molecules from '@/components/molecules';

// Import with type annotations
import Button, { ButtonProps } from '@/components/atoms/Button';
```

### Styling Guidelines

#### Custom Styles
```typescript
// Using className prop
<Button className="custom-button-style">Custom Button</Button>

// Using style variants
<Button variant="primary" size="lg">Large Primary</Button>

// Combining with utility classes
<Card className="p-6 shadow-lg">Custom Card</Card>
```

#### Responsive Design
```typescript
// Mobile-first approach
<div className="block sm:hidden">
  Mobile content
</div>

<div className="hidden sm:block">
  Desktop content
</div>

// Responsive sizing
<Button size="sm md:lg">Responsive Button</Button>
```

### Accessibility Guidelines

#### Semantic HTML
```typescript
// Use semantic elements
<Header> {/* <header> */}</Header>
<Main> {/* <main> */}</Main>
<Navigation> {/* <nav> */}</Navigation>

// ARIA attributes
<Button aria-label="Close modal" aria-expanded={isOpen}>
  <Icon name="close" />
</Button>
```

#### Keyboard Navigation
```typescript
// Focus management
<Input ref={inputRef} autoFocus />
<Modal onClose={closeModal} initialFocus={inputRef} />

// Keyboard events
<div onKeyDown={handleKeyDown} tabIndex={0}>
  Keyboard accessible content
</div>
```

## Testing

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/atoms/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Storybook Integration
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/atoms/Button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};
```

## Performance Considerations

### Code Splitting
```typescript
// Dynamic imports for large components
const HeavyComponent = dynamic(() => import('@/components/organisms/HeavyComponent'), {
  loading: () => <div>Loading...</div>,
});
```

### Memoization
```typescript
// Use React.memo for expensive components
export const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return expensiveProcessing(rawData);
}, [rawData]);
```

### Bundle Optimization
```typescript
// Tree-shaking friendly imports
import { Button } from '@/components/atoms/Button';
// Instead of
import * as Components from '@/components/atoms';
```

---

This component library will be continuously updated as the project evolves.
