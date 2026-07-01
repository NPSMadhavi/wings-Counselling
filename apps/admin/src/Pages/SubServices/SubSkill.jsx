import SubServiceLayout from "./SubServiceLayout";
import { skillParenting } from "./subServiceConfig";

export default function Skill() {
  return <SubServiceLayout {...skillParenting} />;
}
