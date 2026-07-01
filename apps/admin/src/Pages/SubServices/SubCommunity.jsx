import SubServiceLayout from "./SubServiceLayout";
import { communityProgrammes } from "./subServiceConfig";

export default function Community() {
  return <SubServiceLayout {...communityProgrammes} />;
}
