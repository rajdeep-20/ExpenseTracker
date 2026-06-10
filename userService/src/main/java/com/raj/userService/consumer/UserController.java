package com.raj.userService.consumer;

import com.raj.userService.entity.UserInfoDto;
import com.raj.userService.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/user/v1/getUser")
    public ResponseEntity<UserInfoDto> getUser(@RequestBody UserInfoDto data)
    {
        try{
            UserInfoDto userInfoDto = userService.getUser(data);
            return new ResponseEntity<>(userInfoDto, HttpStatus.OK);
        }
        catch (Exception e)
        {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PostMapping("/user/v1/createOrUpdate")
    public ResponseEntity<UserInfoDto> createUpdateUser(@RequestBody UserInfoDto data)
    {
        try{
            UserInfoDto user = userService.createOrUpdateUser(data);
            return new ResponseEntity<>(user, HttpStatus.OK);
        }
        catch (Exception e)
        {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }


    @GetMapping("user/v1/health")
    public ResponseEntity<Boolean> health()
    {
        return new ResponseEntity<>(true,HttpStatus.OK);
    }
}
