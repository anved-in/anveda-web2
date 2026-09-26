import ShopShell from "@/components/ShopShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShopShell>{children}</ShopShell>;
}
