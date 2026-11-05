require "test_helper"

class BrewsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @brew = brews(:one)
    @recipe = @brew.recipe
  end

  test "should get index" do
    get brews_url
    assert_response :success
  end

  test "should get new" do
    get new_brew_url
    assert_response :success
  end

  test "should create brew" do
    assert_difference("Brew.count") do
      post recipe_brews_url(@recipe), params: { brew: { dose: @brew.dose, grind: @brew.grind, recipe_id: @brew.recipe_id, star: false } }
    end

    assert_redirected_to recipe_url(@recipe)
  end

  test "should show brew" do
    get brew_url(@brew)
    assert_response :success
  end

  test "should get edit" do
    get edit_brew_url(@brew)
    assert_response :success
  end

  test "should update brew" do
    patch brew_url(@brew), params: { brew: { dose: 19.0, grind: 4.5 } }
    assert_redirected_to root_path
  end

  test "should toggle star on brew" do
    patch toggle_star_brew_url(@brew), params: { star: true }, as: :json
    assert_response :success
    assert @brew.reload.star?
  end

  test "should destroy brew" do
    assert_difference("Brew.count", -1) do
      delete brew_url(@brew)
    end

    assert_redirected_to recipe_url(@recipe)
  end
end
