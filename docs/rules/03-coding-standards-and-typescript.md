# Rule Spec 03: Coding Standards & TypeScript Directives

## 1. Enterprise Directives
This codebase strictly enforces enterprise-grade React Native & TypeScript standards.

---

## 2. Immutable Engineering Directives

### Directive 1: STRICT NO-HARDCODING POLICY
- Never hardcode dynamic API URLs, timeout limits, magic numbers, or user-facing strings directly inside components or logic files.
- Configuration settings must be injected via `src/config/env.config.ts`.
- Design variables (colors, fonts, radii, spacing) MUST be referenced from `src/ui/theme`.

### Directive 2: FAIL-FAST & NO SILENT FAILURES
- Never write defensive "hacks" or fall back to dummy mock data when a core service operation fails unexpected logic.
- Surface errors immediately with typed enterprise exceptions (`AppError`).

### Directive 3: STRUCTURED ERROR HANDLING
- Errors must be returned in the standardized `ApiResponse<T>` format or handled via custom error boundaries.
- Catch blocks MUST NEVER be empty (`catch (e) {}` is strictly forbidden).

### Directive 4: DETERMINISTIC & MODULAR LOGIC
- Enforce SOLID principles: Single Responsibility per module, Open/Closed for service drivers, Interface Segregation for domain services.
- Functions must have strict type signatures for parameters and explicit return types.

---

## 3. TypeScript Configuration Rules

- `strict: true` enabled in `tsconfig.json`.
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- The `any` type is **STRICTLY PROHIBITED**. Use `unknown` with explicit type guards when data type is uncertain.

---

## 4. React Native & Expo UI Rules

### Rule 3.1: Component Composition
- Keep React components small, functional, and purely presentation-focused.
- UI components accept data props and event handlers. Business logic resides strictly inside Custom Hooks.

### Rule 3.2: Styling Standards
- UI styling must use React Native `StyleSheet.create({})` or styled design tokens from `@/ui/theme`.
- Inline magic style objects (e.g. `style={{ padding: 17, color: '#334155' }}`) are STRICTLY PROHIBITED. Use theme spacing and color tokens instead (`theme.spacing.md`, `theme.colors.text.primary`).

### Rule 3.3: Accessibility (a11y)
- All interactive elements (`Pressable`, `TouchableOpacity`, `Button`) MUST include `accessible={true}`, `accessibilityLabel`, and `accessibilityRole` properties.
