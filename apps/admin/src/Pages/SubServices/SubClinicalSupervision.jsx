import SubServiceLayout from "./SubServiceLayout";
import { clinicalSupervision } from "./subServiceConfig";

export default function ClinicalSupervision() {
  return <SubServiceLayout {...clinicalSupervision} />;
}
