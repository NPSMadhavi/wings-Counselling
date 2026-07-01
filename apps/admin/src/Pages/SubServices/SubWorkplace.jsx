import SubServiceLayout from "./SubServiceLayout";
import { workplaceWellness } from "./subServiceConfig";

export default function Workplace() {
  return <SubServiceLayout {...workplaceWellness} />;
}
