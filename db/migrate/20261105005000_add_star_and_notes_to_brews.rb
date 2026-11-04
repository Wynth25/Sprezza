class AddStarAndNotesToBrews < ActiveRecord::Migration[8.1]
  def change
    add_column :brews, :star, :boolean, default: false unless column_exists?(:brews, :star)
    add_column :brews, :notes, :text unless column_exists?(:brews, :notes)
  end
end
