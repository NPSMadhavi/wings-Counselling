import SubServiceLayout from "./SubServices/SubServiceLayout";
import { individualTherapy } from "./SubServices/subServiceConfig";

export default function SubServicePage() {
  return <SubServiceLayout {...individualTherapy} />;
}
