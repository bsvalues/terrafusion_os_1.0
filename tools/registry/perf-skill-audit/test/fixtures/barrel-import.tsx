// Fixture: Barrel imports that should be replaced with direct imports
import { Button } from './components'; // Should become: import { Button } from './components/Button';

export function Page() {
  return <Button>Click me</Button>;
}
