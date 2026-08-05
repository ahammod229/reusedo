-- M14: Analytics & Business Intelligence Module
-- This module contains read-only RPCs for dashboard aggregations.

-- 1. User Dashboard Summary
CREATE OR REPLACE FUNCTION get_user_dashboard_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_active_exchanges INT;
  v_my_products INT;
  v_my_needs INT;
  v_unread_notifications INT;
  v_trust_score INT;
BEGIN
  -- Count active exchanges (status = 'pending' or 'accepted' or 'shipping')
  SELECT COUNT(*) INTO v_active_exchanges 
  FROM exchanges 
  WHERE (proposer_id = p_user_id OR receiver_id = p_user_id) 
    AND status IN ('pending', 'accepted', 'shipping');

  -- Count published products
  SELECT COUNT(*) INTO v_my_products 
  FROM products 
  WHERE owner_id = p_user_id AND status = 'published';

  -- Count open needs
  SELECT COUNT(*) INTO v_my_needs 
  FROM needs 
  WHERE owner_id = p_user_id AND status = 'open';

  -- Count unread notifications
  SELECT COUNT(*) INTO v_unread_notifications
  FROM notifications
  WHERE user_id = p_user_id AND is_read = false;

  -- Get trust score
  SELECT trust_score INTO v_trust_score
  FROM profiles
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'active_exchanges', v_active_exchanges,
    'my_products', v_my_products,
    'my_needs', v_my_needs,
    'unread_notifications', v_unread_notifications,
    'trust_score', COALESCE(v_trust_score, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Admin KPI Dashboard Summary
CREATE OR REPLACE FUNCTION get_admin_kpi_summary()
RETURNS JSONB AS $$
DECLARE
  v_total_users INT;
  v_active_users INT;
  v_total_products INT;
  v_total_needs INT;
  v_total_exchanges INT;
  v_completed_exchanges INT;
  v_success_rate NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM profiles;
  
  SELECT COUNT(*) INTO v_active_users FROM profiles WHERE is_verified = true;

  SELECT COUNT(*) INTO v_total_products FROM products;
  SELECT COUNT(*) INTO v_total_needs FROM needs;
  SELECT COUNT(*) INTO v_total_exchanges FROM exchanges;
  SELECT COUNT(*) INTO v_completed_exchanges FROM exchanges WHERE status = 'completed';

  IF v_total_exchanges > 0 THEN
    v_success_rate := ROUND((v_completed_exchanges::NUMERIC / v_total_exchanges::NUMERIC) * 100, 2);
  ELSE
    v_success_rate := 0;
  END IF;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'active_users', v_active_users,
    'total_products', v_total_products,
    'total_needs', v_total_needs,
    'total_exchanges', v_total_exchanges,
    'completed_exchanges', v_completed_exchanges,
    'success_rate', v_success_rate
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
