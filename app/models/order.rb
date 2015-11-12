class Order < ActiveRecord::Base
  has_many :cart_entries
  has_many :products, :through => :cart_entries
  belongs_to :user_data

  validates_presence_of :cart_entries, :user_data

  def entries_with(type)
    self.cart_entries.select { | e | e if e.order_type == type }
  end

  def total
    self.cart_entries.reduce(0) { |sum, entry| sum + entry.subtotal }
  end
end