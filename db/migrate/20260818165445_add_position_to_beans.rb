class AddPositionToBeans < ActiveRecord::Migration[8.1]
  def change
    add_column :beans, :position, :integer unless column_exists?(:beans, :position)
  end
end
