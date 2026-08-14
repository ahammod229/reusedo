import { getSupabaseClient } from "../client";

export type UserAddress = {
  id: string;
  user_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  district: string;
  upazila: string;
  area: string;
  postal_code: string;
  landmark?: string | null;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
};

export class AddressRepository {
  private getClient = () => getSupabaseClient(true);

  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching addresses: ${error.message}`);
    }

    return data as UserAddress[];
  }

  async getAddressById(id: string, userId: string): Promise<UserAddress | null> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Error fetching address: ${error.message}`);
    }

    return data as UserAddress;
  }

  async createAddress(
    address: Omit<UserAddress, "id" | "created_at" | "updated_at">,
  ): Promise<UserAddress> {
    const supabase = this.getClient();

    // If setting as default, unset others first
    if (address.is_default) {
      await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", address.user_id);
    }

    const { data, error } = await supabase.from("user_addresses").insert(address).select().single();

    if (error) {
      throw new Error(`Error creating address: ${error.message}`);
    }

    return data as UserAddress;
  }

  async updateAddress(
    id: string,
    userId: string,
    updates: Partial<Omit<UserAddress, "id" | "user_id">>,
  ): Promise<UserAddress> {
    const supabase = this.getClient();

    // If setting as default, unset others first
    if (updates.is_default) {
      await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", userId);
    }

    const { data, error } = await supabase
      .from("user_addresses")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating address: ${error.message}`);
    }

    return data as UserAddress;
  }

  async deleteAddress(id: string, userId: string): Promise<void> {
    const supabase = this.getClient();
    const { error } = await supabase
      .from("user_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Error deleting address: ${error.message}`);
    }
  }
}
