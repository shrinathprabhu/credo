import { SharedSecretPage } from "@/components/SharedSecretPage";
import { ShareFromLocation } from "@/components/ShareFromLocation";

export { metadata } from "@/components/SharedSecretPage";

export default function SharePage() {
  return <SharedSecretPage><ShareFromLocation /></SharedSecretPage>;
}
