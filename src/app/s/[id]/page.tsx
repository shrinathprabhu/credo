import { SharedSecretPage } from "@/components/SharedSecretPage";
import { RevealSecret } from "@/components/RevealSecret";

export { metadata } from "@/components/SharedSecretPage";

// Local Next.js development resolves the ID here. Workers uses the static share shell.
export const dynamicParams = true;
export const revalidate = false;

export function generateStaticParams() {
  return [] as { id: string }[];
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SharedSecretPage><RevealSecret initialId={id} /></SharedSecretPage>;
}
