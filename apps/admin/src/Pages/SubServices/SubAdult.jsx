import SubServiceLayout from "./SubServiceLayout";
import { adultCounselling } from "./subServiceConfig";

export default function Adult() {
  return <SubServiceLayout {...adultCounselling} />;
}
