"use client";

import AccountShell from "./AccountShell";
import ProfileHub from "./ProfileHub";
import OrdersView from "./OrdersView";
import DetailsForm from "./DetailsForms";

const Heading = ({ title, intro }: { title: string; intro?: string }) => (
  <>
    <h1 className="font-display text-[clamp(28px,4vw,40px)] leading-tight">{title}</h1>
    {intro && <p className="mt-3 text-[14.5px] text-ink-soft">{intro}</p>}
  </>
);

export function AccountHomePage() {
  return <AccountShell title="Your account">{(me, api) => <ProfileHub me={me} onLogout={api.logout} />}</AccountShell>;
}

export function AccountOrdersPage() {
  return (
    <AccountShell title="My orders" back>
      {(me) => (
        <>
          <Heading title="My orders" intro="Open an order to see where it is and its tracking number." />
          <OrdersView orders={me.orders} />
        </>
      )}
    </AccountShell>
  );
}

export function AccountProfilePage() {
  return (
    <AccountShell title="Edit profile" back>
      {(me, api) => (
        <>
          <Heading title="Edit profile" intro="Your name and mobile number are used on parcels and for order updates." />
          <DetailsForm me={me} mode="person" onSaved={api.setProfile} onRefresh={api.refresh} />
        </>
      )}
    </AccountShell>
  );
}

export function AccountAddressPage() {
  return (
    <AccountShell title="Saved address" back>
      {(me, api) => (
        <>
          <Heading title="Saved address" intro="Checkout fills this in for you, so you only confirm and pay." />
          <DetailsForm me={me} mode="address" onSaved={api.setProfile} onRefresh={api.refresh} />
        </>
      )}
    </AccountShell>
  );
}
