# UI components

Base primitives adapted to the `glass-dark` theme. They use design tokens, contain no business
logic and do not access Dexie.

| Component       | Variants / notes                                                           |
| --------------- | -------------------------------------------------------------------------- |
| `Button`        | `primary`, `secondary`, `ghost`, `danger`; `sm`, `md`, `lg`; loading state |
| `Card`          | default and `strong` glass surface                                         |
| `Input`         | label, hint and error, with accessible descriptions                        |
| `Textarea`      | same field API as `Input`                                                  |
| `Select`        | native select with the same field API                                      |
| `Modal`         | native `<dialog>` with focus containment and Escape/backdrop dismissal     |
| `ConfirmDialog` | modal with confirm/cancel actions and `default`/`danger` tone              |
| `Skeleton`      | decorative loading placeholder                                             |
| `EmptyState`    | title, optional description, icon and action                               |

```tsx
import { Button, Card, Input } from '@/components/ui';

<Card strength="strong">
  <Input label="Amount" inputMode="decimal" />
  <Button isLoading>Save</Button>
</Card>;
```

The app toast/notification region is deferred to T07 (app shell), where it can be mounted once.
