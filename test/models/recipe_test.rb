require "test_helper"

class RecipeTest < ActiveSupport::TestCase
  test "espresso recipe requires basket and clears water" do
    recipe = Recipe.new(bean: beans(:one), style: "Espresso", water: 300)
    assert_not recipe.valid?
    assert_includes recipe.errors[:basket], "can't be blank"

    recipe.basket = baskets(:one)
    assert recipe.valid?
    assert_nil recipe.water
    assert_equal baskets(:one).name, recipe.display_title
    assert_nil recipe.corner_badge
  end

  test "pour-over recipe requires positive water and allows nil basket" do
    recipe = Recipe.new(bean: beans(:one), basket: baskets(:one), style: "Pour-over")
    assert_not recipe.valid?
    assert recipe.errors[:water].any?

    recipe.water = 300
    assert recipe.valid?
    assert_nil recipe.basket_id
    assert_equal "300ml", recipe.display_title
    assert_equal "P", recipe.corner_badge
  end
end
